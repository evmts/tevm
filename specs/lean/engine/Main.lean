import EngineFsmSpec

/-!
# `engine-spec`: batch trace oracle

Reads tab-separated command traces from stdin and prints the expected observable result
of every step, as defined by `EngineFsm.Engine.step`.

Input, one record per line, fields separated by tabs:

```
T <name> <consoleLog 0|1> <backendDrains 0|1> <addr,addr,...> <slot,slot,...>
setBalance <addr> <value>          setNonce <addr> <value>
setCode <addr> <hex>               setStorageAt <addr> <slot> <value>
mine <count>                       snapshot
revert <id>                        getBalance <addr>
getTransactionCount <addr>         getCode <addr>
getStorageAt <addr> <slot>         blockNumber
call <addr>                        callInvalid
unknown                            close
```

Numbers are `0x` hex. A `T` line starts a new engine and names the addresses and slots
that the state column reports.

Output, one line per step:

```
<name> <step> <outcome> <sent ids> <backend closes> <state>
```
-/

open EngineFsm

def hexDigit (c : Char) : Option Nat :=
  if '0' ≤ c ∧ c ≤ '9' then some (c.toNat - '0'.toNat)
  else if 'a' ≤ c ∧ c ≤ 'f' then some (c.toNat - 'a'.toNat + 10)
  else if 'A' ≤ c ∧ c ≤ 'F' then some (c.toNat - 'A'.toNat + 10)
  else none

/-- Parse a `0x` hex number of any size. -/
def parseHex (s : String) : Option Nat :=
  match s.toList with
  | '0' :: 'x' :: ds =>
    if ds.isEmpty then none
    else ds.foldlM (fun acc c => (hexDigit c).map (acc * 16 + ·)) 0
  | _ => none

/-- Strip the `0x` prefix from hex data. -/
def parseData (s : String) : Option String :=
  match s.toList with
  | '0' :: 'x' :: ds => some (String.ofList ds)
  | _ => none

def hexDigits (n : Nat) : String := String.ofList (Nat.toDigits 16 n)

def quantity (n : Nat) : String := "0x" ++ hexDigits n

def padded (width n : Nat) : String :=
  let d := Nat.toDigits 16 n
  "0x" ++ String.ofList (List.replicate (width - d.length) '0' ++ d)

def renderResp : Resp → String
  | .bool b => if b then "ok:true" else "ok:false"
  | .quantity n => "ok:\"" ++ quantity n ++ "\""
  | .word n => "ok:\"" ++ padded 64 n ++ "\""
  | .data hex => "ok:\"0x" ++ hex ++ "\""
  | .error code => "err:" ++ toString code
  | .unmodeled => "unmodeled"

def renderOutcome : Outcome → String
  | .response r => renderResp r
  | .rejected => "rejected:engine is closed"
  | .closeOk => "closed"

def renderSent (sent : List BackendCall) : String :=
  if sent.isEmpty then "-"
  else ",".intercalate (sent.map fun c => toString c.id ++ (if c.drain then "d" else ""))

def renderState (e : Engine) (addrs slots : List Nat) : String :=
  if e.closed then "-"
  else
    let w := e.node.world
    let accounts := addrs.map fun a =>
      let acc := w.get a
      let storage := slots.map fun k => quantity k ++ "=" ++ quantity (acc.slot k)
      padded 40 a ++ ":" ++ quantity acc.balance ++ "," ++ quantity acc.nonce ++ ",0x" ++ acc.code
        ++ "," ++ ",".intercalate storage
    "b=" ++ quantity w.blockNumber ++ ";" ++ ";".intercalate accounts

def parseOp (fields : List String) : Option Op :=
  match fields with
  | ["setBalance", a, v] => do pure (.request (.setBalance (← parseHex a) (← parseHex v)))
  | ["setNonce", a, v] => do pure (.request (.setNonce (← parseHex a) (← parseHex v)))
  | ["setCode", a, c] => do pure (.request (.setCode (← parseHex a) (← parseData c)))
  | ["setStorageAt", a, k, v] =>
    do pure (.request (.setStorageAt (← parseHex a) (← parseHex k) (← parseHex v)))
  | ["mine", c] => do pure (.request (.mine (← parseHex c)))
  | ["snapshot"] => some (.request .snapshot)
  | ["revert", i] => do pure (.request (.revert (← parseHex i)))
  | ["getBalance", a] => do pure (.request (.getBalance (← parseHex a)))
  | ["getTransactionCount", a] => do pure (.request (.getTransactionCount (← parseHex a)))
  | ["getCode", a] => do pure (.request (.getCode (← parseHex a)))
  | ["getStorageAt", a, k] => do pure (.request (.getStorageAt (← parseHex a) (← parseHex k)))
  | ["blockNumber"] => some (.request .blockNumber)
  | ["call", a] => do pure (.request (.call (← parseHex a)))
  | ["callInvalid"] => some (.request .callInvalid)
  | ["unknown"] => some (.request .unknown)
  | ["close"] => some .close
  | _ => none

structure Session where
  name : String
  cfg : Config
  addrs : List Nat
  slots : List Nat
  engine : Engine
  index : Nat

def parseList (s : String) : Option (List Nat) :=
  if s.isEmpty then some [] else (s.splitOn ",").mapM parseHex

def parseHeader (fields : List String) : Option Session :=
  match fields with
  | ["T", name, consoleLog, drains, addrs, slots] => do
    let cfg : Config := ⟨consoleLog == "1", drains == "1"⟩
    pure ⟨name, cfg, ← parseList addrs, ← parseList slots, Engine.init cfg, 0⟩
  | _ => none

partial def loop (stdin stdout : IO.FS.Stream) (session : Option Session) (lineNo : Nat) :
    IO UInt32 := do
  let raw ← stdin.getLine
  if raw.isEmpty then
    stdout.flush
    return 0
  let line := String.ofList (raw.toList.filter fun c => c != '\n' && c != '\r')
  if line.isEmpty then return ← loop stdin stdout session (lineNo + 1)
  let fields := line.splitOn "\t"
  if fields.head? == some "T" then
    match parseHeader fields with
    | some s => loop stdin stdout (some s) (lineNo + 1)
    | none =>
      IO.eprintln s!"line {lineNo}: malformed trace header"
      return 1
  else
    match session, parseOp fields with
    | some s, some op =>
      let (engine, out) := s.engine.step s.cfg op
      stdout.putStrLn ("\t".intercalate
        [s.name, toString s.index, renderOutcome out.outcome, renderSent out.sent,
          toString engine.backendCloses, renderState engine s.addrs s.slots])
      loop stdin stdout (some { s with engine := engine, index := s.index + 1 }) (lineNo + 1)
    | none, _ =>
      IO.eprintln s!"line {lineNo}: command before the first trace header"
      return 1
    | _, none =>
      IO.eprintln s!"line {lineNo}: malformed command: {line}"
      return 1

def main : IO UInt32 := do
  loop (← IO.getStdin) (← IO.getStdout) none 1
