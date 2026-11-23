import ProtocolSpec

/-!
# `protocol-spec`: batch oracle

Reads one tab-separated query per line from stdin and prints one answer line
per query to stdout, in order. Numbers are decimal or `0x` hex in, decimal out.
A malformed query answers `error`. One process answers the whole batch.

| query                                                       | answer                       |
|-------------------------------------------------------------|------------------------------|
| `clz x`                                                     | `n`                          |
| `opclz fork x`                                              | `n` or `invalid`             |
| `txgas fork gasLimit`                                       | `1` valid, `0` invalid       |
| `blocksize fork rlpSize`                                    | `1` valid, `0` invalid       |
| `fakeexp factor numerator denominator`                      | `n`                          |
| `blobfee excessBlobGas updateFraction`                      | `n`                          |
| `excess fork target max fraction parentExcess used baseFee` | `n`                          |
| `schedule timestamp`                                        | `target max fraction` or `none` |
| `excessat childTimestamp parentExcess used baseFee`         | `n` or `none` (mainnet schedule) |
| `modexpgas fork baseLen expLen modLen expHead`              | `n`                          |
| `modexpbounds fork baseLen expLen modLen`                   | `1` or `0`                   |
| `powmod base exp modulus`                                   | `n` (EIP-198 value)          |
| `modexp fork 0xinput`                                       | `ok gas 0xoutput` or `halt`  |
-/

open ProtocolSpec

def hexDigit? (c : Char) : Option Nat :=
  if '0' ≤ c ∧ c ≤ '9' then some (c.toNat - '0'.toNat)
  else if 'a' ≤ c ∧ c ≤ 'f' then some (c.toNat - 'a'.toNat + 10)
  else if 'A' ≤ c ∧ c ≤ 'F' then some (c.toNat - 'A'.toNat + 10)
  else none

def hexDigits? (cs : List Char) : Option (List Nat) := cs.mapM hexDigit?

/-- Decimal or `0x`-prefixed hex natural number. -/
def parseNat? (s : String) : Option Nat :=
  match s.toList with
  | '0' :: 'x' :: rest =>
    if rest.isEmpty then none
    else (hexDigits? rest).map fun ds => ds.foldl (fun acc d => acc * 16 + d) 0
  | _ => s.toNat?

def pairBytes : List Nat → Option (List Nat)
  | [] => some []
  | hi :: lo :: rest => (pairBytes rest).map fun t => (hi * 16 + lo) :: t
  | [_] => none

/-- `0x`-prefixed even-length hex string to bytes. -/
def parseBytes? (s : String) : Option (Array Nat) :=
  match s.toList with
  | '0' :: 'x' :: rest => (hexDigits? rest >>= pairBytes).map List.toArray
  | _ => none

def hexChar (n : Nat) : Char :=
  if n < 10 then Char.ofNat (n + '0'.toNat) else Char.ofNat (n - 10 + 'a'.toNat)

def bytesToHex (bytes : List Nat) : String :=
  String.ofList ('0' :: 'x' :: bytes.flatMap fun b => [hexChar (b / 16), hexChar (b % 16)])

def boolStr (b : Bool) : String := if b then "1" else "0"

def answer (fields : List String) : Option String :=
  match fields with
  | ["clz", x] => do
    let x ← parseNat? x
    pure (toString (clz256 x))
  | ["opclz", f, x] => do
    let f ← Fork.ofString? f
    let x ← parseNat? x
    pure (match clzOpcode f x with | some n => toString n | none => "invalid")
  | ["txgas", f, g] => do
    let f ← Fork.ofString? f
    let g ← parseNat? g
    pure (boolStr (validTxGasLimit f g))
  | ["blocksize", f, n] => do
    let f ← Fork.ofString? f
    let n ← parseNat? n
    pure (boolStr (validBlockRlpSize f n))
  | ["fakeexp", a, b, c] => do
    let a ← parseNat? a
    let b ← parseNat? b
    let c ← parseNat? c
    pure (toString (fakeExponential a b c))
  | ["blobfee", e, u] => do
    let e ← parseNat? e
    let u ← parseNat? u
    pure (toString (blobBaseFee e u))
  | ["excess", f, t, m, u, pe, pu, pb] => do
    let f ← Fork.ofString? f
    let t ← parseNat? t
    let m ← parseNat? m
    let u ← parseNat? u
    let pe ← parseNat? pe
    let pu ← parseNat? pu
    let pb ← parseNat? pb
    pure (toString (calcExcessBlobGas f ⟨t, m, u⟩ pe pu pb))
  | ["schedule", ts] => do
    let ts ← parseNat? ts
    pure (match blobScheduleAt ts with
      | some s => s!"{s.target} {s.max} {s.baseFeeUpdateFraction}"
      | none => "none")
  | ["excessat", ts, pe, pu, pb] => do
    let ts ← parseNat? ts
    let pe ← parseNat? pe
    let pu ← parseNat? pu
    let pb ← parseNat? pb
    pure (match blobScheduleAt ts, blobForkAt ts with
      | some s, some f => toString (calcExcessBlobGas f s pe pu pb)
      | _, _ => "none")
  | ["modexpgas", f, b, e, m, h] => do
    let f ← Fork.ofString? f
    let b ← parseNat? b
    let e ← parseNat? e
    let m ← parseNat? m
    let h ← parseNat? h
    pure (toString (modexpGas f b e m h))
  | ["modexpbounds", f, b, e, m] => do
    let f ← Fork.ofString? f
    let b ← parseNat? b
    let e ← parseNat? e
    let m ← parseNat? m
    pure (boolStr (modexpBoundsOk f b e m))
  | ["powmod", b, e, m] => do
    let b ← parseNat? b
    let e ← parseNat? e
    let m ← parseNat? m
    pure (toString (modexpValue b e m))
  | ["modexp", f, input] => do
    let f ← Fork.ofString? f
    let input ← parseBytes? input
    pure (match modexpPrecompile f input with
      | some r => s!"ok {r.gas} {bytesToHex r.output}"
      | none => "halt")
  | _ => none

/-- Drop the trailing line terminator. -/
def stripEol (s : String) : String :=
  String.ofList (s.toList.reverse.dropWhile fun c => c == '\n' || c == '\r').reverse

partial def loop (stdin stdout : IO.FS.Stream) : IO Unit := do
  let line ← stdin.getLine
  if line.isEmpty then return
  let fields := (stripEol line).splitOn "\t"
  stdout.putStrLn ((answer fields).getD "error")
  loop stdin stdout

def main : IO Unit := do
  let stdin ← IO.getStdin
  let stdout ← IO.getStdout
  loop stdin stdout
  stdout.flush
