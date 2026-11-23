import HostSpec

/-!
Batch oracle for `HostSpec`. Reads one comma-separated query per stdin line and writes one
answer line per query. Text fields are hex-encoded UTF-8, so any character survives the pipe.

```
F,<input>                 -> <n>,<frame>...,<remaining>      extractJsonRpcFrames, one call
G,<chunk>,...             -> <n>,<frame>...,<remaining>      extractJsonRpcFrames, buffered stream
R,<configPath>,<text>     -> O,<n>,<prefix>,<target>... | E,<message>
C,<arg>...                -> <formatted> | U                 arg = s<hex> | i<decimal> | b0 | b1
                                                             U: the text depends on binary rounding
P,<version>               -> N | S,<major>,<minor>,<patch>,(-|p<prerelease>)
S,<version>,<range>       -> 0 | 1
W,<spec>,<targetVersion>  -> <published specifier>
D,<spec>                  -> <unpublishable>,<workspace>
```
-/

open HostSpec

def hexDigit (n : Nat) : Char := Char.ofNat (if n < 10 then 48 + n else 87 + n)

def hexValue (c : Char) : Nat :=
  let n := c.toNat
  if 48 ≤ n && n ≤ 57 then n - 48 else if 97 ≤ n && n ≤ 102 then n - 87 else n - 55

def encodeHex (l : List Char) : String :=
  let bytes := (String.ofList l).toUTF8
  String.ofList (bytes.foldl (fun acc b => hexDigit (b.toNat % 16) :: hexDigit (b.toNat / 16) :: acc) []).reverse

def decodeBytes : List Char → ByteArray → ByteArray
  | hi :: lo :: rest, acc => decodeBytes rest (acc.push (UInt8.ofNat (hexValue hi * 16 + hexValue lo)))
  | _, acc => acc

def decodeHex (l : List Char) : List Char :=
  (String.fromUTF8! (decodeBytes l ByteArray.empty)).toList

def commaJoin (parts : List String) : String := String.intercalate "," parts

def framesAnswer (r : List Framing.Frame × List Char) : String :=
  commaJoin (toString r.1.length :: r.1.map (fun f => encodeHex f.text) ++ [encodeHex r.2])

def decodeArg : List Char → ConsoleFmt.Val
  | 's' :: rest => .str (decodeHex rest)
  | 'i' :: rest => .int ((String.ofList rest).toInt?.getD 0)
  | 'b' :: rest => .bool (rest == ['1'])
  | _ => .str []

def answer (line : List Char) : String :=
  match splitOn ',' line with
  | [['F'], input] => framesAnswer (Framing.extract (decodeHex input))
  | ['G'] :: chunks => framesAnswer ((chunks.map decodeHex).foldl Framing.feed ([], []))
  | [['R'], configPath, text] =>
    match Remappings.parse (decodeHex configPath) (decodeHex text) with
    | .error m => "E," ++ encodeHex m
    | .ok entries =>
      commaJoin ("O" :: toString entries.length ::
        entries.flatMap (fun p => [encodeHex p.1, encodeHex p.2]))
  | ['C'] :: args =>
    match ConsoleFmt.format (args.map decodeArg) with
    | some text => encodeHex text
    | none => "U"
  | [['P'], version] =>
    match Semver.parse (decodeHex version) with
    | none => "N"
    | some v =>
      commaJoin ["S", toString v.major, toString v.minor, toString v.patch,
        match v.prerelease with
        | none => "-"
        | some p => "p" ++ encodeHex p]
  | [['S'], version, range] =>
    if Semver.satisfies (decodeHex version) (decodeHex range) then "1" else "0"
  | [['W'], spec, target] => encodeHex (Semver.resolveWorkspaceRange (decodeHex spec) (decodeHex target))
  | [['D'], spec] =>
    let s := decodeHex spec
    commaJoin [if Semver.unpublishable s then "1" else "0", if Semver.isWorkspaceSpec s then "1" else "0"]
  | _ => "?"

partial def loop (stdin stdout : IO.FS.Stream) : IO Unit := do
  let line ← stdin.getLine
  if line.isEmpty then return
  let query := line.toList.filter (fun c => c != '\n' && c != '\r')
  stdout.putStrLn (answer query)
  loop stdin stdout

def main : IO Unit := do
  let stdin ← IO.getStdin
  let stdout ← IO.getStdout
  loop stdin stdout
  stdout.flush
