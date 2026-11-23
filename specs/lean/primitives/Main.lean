import PrimitivesSpec

/-!
Batch oracle for `PrimitivesSpec`. Reads one query per line on stdin and writes one
answer per line on stdout, in order. Tokens are separated by a single space; the last
argument of `qdec`, `qdec256` and `ddec` is the raw remainder of the line.

```
g2w <decimal>              ok <int> | err
w2g <nat>                  ok <whole>.<9 digits>
w2gt <nat>                 ok <shortest exact decimal>
pc <0x address> <fork>     <precompile | none> <1 | 0>
p256 <fork> <gas> <0xhex>  none | <success> <gasUsed> <0x output> <check>
qenc <nat>                 ok <0x quantity>
qdec <text>                ok <nat> | err
qdec256 <text>             ok <nat> | err
denc <b,b,...| ->          ok <0x data>
ddec <text>                ok <b,b,... | -> | err
add | mul | sub <a> <b>    ok <nat> | none
cost <gas> <fee> <value>   ok <nat> | none
```
-/

open PrimitivesSpec

def forkName : Fork → String
  | .frontier => "frontier" | .homestead => "homestead" | .dao => "dao"
  | .tangerineWhistle => "tangerinewhistle" | .spuriousDragon => "spuriousdragon"
  | .byzantium => "byzantium" | .constantinople => "constantinople"
  | .petersburg => "petersburg" | .istanbul => "istanbul" | .muirGlacier => "muirglacier"
  | .berlin => "berlin" | .london => "london" | .arrowGlacier => "arrowglacier"
  | .grayGlacier => "grayglacier" | .merge => "merge" | .shanghai => "shanghai"
  | .cancun => "cancun" | .prague => "prague" | .osaka => "osaka" | .amsterdam => "amsterdam"

def forkOfName (s : String) : Option Fork := Fork.all.find? (fun f => forkName f == s)

def blsName : BlsOp → String
  | .g1Add => "BLS12_G1_ADD" | .g1Msm => "BLS12_G1_MSM" | .g2Add => "BLS12_G2_ADD"
  | .g2Msm => "BLS12_G2_MSM" | .pairingCheck => "BLS12_PAIRING"
  | .mapFpToG1 => "BLS12_MAP_FP_TO_G1" | .mapFp2ToG2 => "BLS12_MAP_FP2_TO_G2"

def precompileName : Precompile → String
  | .ecrecover => "ECRECOVER" | .sha256 => "SHA256" | .ripemd160 => "RIPEMD160"
  | .identity => "IDENTITY" | .modexp => "MODEXP" | .bn254Add => "BN254_ADD"
  | .bn254Mul => "BN254_MUL" | .bn254Pairing => "BN254_PAIRING" | .blake2f => "BLAKE2F"
  | .pointEvaluation => "POINT_EVALUATION" | .bls op => blsName op
  | .p256Verify => "P256_VERIFY"

def checkName : P256.Check → String
  | .badLength => "badLength" | .badScalar => "badScalar" | .badField => "badField"
  | .infinity => "infinity" | .offCurve => "offCurve" | .badSignature => "badSignature"
  | .valid => "valid"

/-- Split at the first space. -/
def splitFirst : List Char → List Char × List Char
  | [] => ([], [])
  | ' ' :: t => ([], t)
  | c :: t => let (a, r) := splitFirst t; (c :: a, r)

def str (cs : List Char) : String := String.ofList cs

def natArg (cs : List Char) : Option Nat := ofDigits 10 cs

/-- A 20-byte address literal: `0x` and exactly 40 hex digits. -/
def addressArg : List Char → Option Nat
  | '0' :: 'x' :: ds => if ds.length = 40 then ofDigitsAux 16 0 ds else none
  | _ => none

def splitCommas (cs : List Char) : List (List Char) :=
  cs.foldr (fun c acc =>
    match acc with
    | [] => if c = ',' then [[], []] else [[c]]
    | h :: t => if c = ',' then [] :: h :: t else (c :: h) :: t) []

def bytesArg (cs : List Char) : Option (List UInt8) :=
  if cs = ['-'] then some []
  else (splitCommas cs).mapM (fun d =>
    match natArg d with
    | some n => if n < 256 then some (UInt8.ofNat n) else none
    | none => none)

def showBytes (bs : List UInt8) : String :=
  if bs.isEmpty then "-" else ",".intercalate (bs.map (fun b => toString b.toNat))

def showOpt (r : Option Nat) (fallback : String) : String :=
  match r with
  | some n => s!"ok {n}"
  | none => fallback

def binary (f : Nat → Nat → Option Nat) (rest : List Char) : String :=
  let (a, b) := splitFirst rest
  match natArg a, natArg b with
  | some x, some y => showOpt (f x y) "none"
  | _, _ => "bad-query"

def answer (line : List Char) : String :=
  let (cmd, rest) := splitFirst line
  match str cmd with
  | "g2w" =>
    match parseDecimalChars rest with
    | some d => s!"ok {gweiToWei d}"
    | none => "err"
  | "w2g" =>
    match natArg rest with
    | some n => s!"ok {weiToGwei n}"
    | none => "bad-query"
  | "w2gt" =>
    match natArg rest with
    | some n => s!"ok {weiToGweiTrimmed n}"
    | none => "bad-query"
  | "pc" =>
    let (a, f) := splitFirst rest
    match forkOfName (str f) with
    | none => "bad-query"
    | some fork =>
      match (addressArg a).bind precompileOfAddr with
      | some p => s!"{precompileName p} {if fork.isAtLeast p.activation then 1 else 0}"
      | none => "none 0"
  | "p256" =>
    let (f, rest) := splitFirst rest
    let (g, hex) := splitFirst rest
    match forkOfName (str f), natArg g, parseDataChars hex with
    | some fork, some gasLimit, some input =>
      match P256.execute fork input gasLimit with
      | none => "none"
      | some r =>
        s!"{if r.success then 1 else 0} {r.gasUsed} {encodeData r.output} {checkName (P256.classify input)}"
    | _, _, _ => "bad-query"
  | "qenc" =>
    match natArg rest with
    | some n => s!"ok {encodeQuantity n}"
    | none => "bad-query"
  | "qdec" => showOpt (parseQuantityChars rest) "err"
  | "qdec256" => showOpt (parseQuantityU256 (str rest)) "err"
  | "denc" =>
    match bytesArg rest with
    | some bs => s!"ok {encodeData bs}"
    | none => "bad-query"
  | "ddec" =>
    match parseDataChars rest with
    | some bs => s!"ok {showBytes bs}"
    | none => "err"
  | "add" => binary checkedAdd rest
  | "mul" => binary checkedMul rest
  | "sub" => binary checkedSub rest
  | "cost" =>
    let (g, rest) := splitFirst rest
    let (f, v) := splitFirst rest
    match natArg g, natArg f, natArg v with
    | some x, some y, some z => showOpt (checkedTxCost x y z) "none"
    | _, _, _ => "bad-query"
  | _ => "bad-query"

partial def loop (stdin stdout : IO.FS.Stream) : IO Unit := do
  let line ← stdin.getLine
  if line.isEmpty then return
  let cs := line.toList
  let cs := if cs.getLast? = some '\n' then cs.dropLast else cs
  stdout.putStrLn (answer cs)
  loop stdin stdout

def main : IO Unit := do
  let stdin ← IO.getStdin
  let stdout ← IO.getStdout
  loop stdin stdout
  stdout.flush
