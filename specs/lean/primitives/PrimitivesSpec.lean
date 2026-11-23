/-!
# Voltaire / TEVM primitives: executable reference specification

Pure Lean 4 (no Mathlib, no Lake dependencies). Every definition is executable and
is the oracle used by `diff-fuzz.test.mjs`; every theorem is proved (no `sorry`).

Sections:
1. Positional digits (shared by decimal and hexadecimal codecs)
2. `FeeMarket.gweiToWei` / `weiToGwei` (exact base-10 scaling)
3. Hardforks and the precompile dispatch table (EIP-2537 final layout)
4. EIP-7951 `P256VERIFY`
5. JSON-RPC `Quantity` and `Data` hex codecs
6. Checked `u256` fee / value arithmetic
-/

namespace PrimitivesSpec

/-! ## 1. Positional digits -/

/-- Lowercase digit character for a digit value `0..15`. -/
def digitChar : Nat → Char
  | 0 => '0' | 1 => '1' | 2 => '2' | 3 => '3' | 4 => '4' | 5 => '5' | 6 => '6' | 7 => '7'
  | 8 => '8' | 9 => '9' | 10 => 'a' | 11 => 'b' | 12 => 'c' | 13 => 'd' | 14 => 'e' | _ => 'f'

/-- Value of a hexadecimal digit character. Both cases are accepted. -/
def hexVal (c : Char) : Option Nat :=
  if c = '0' then some 0 else if c = '1' then some 1 else if c = '2' then some 2
  else if c = '3' then some 3 else if c = '4' then some 4 else if c = '5' then some 5
  else if c = '6' then some 6 else if c = '7' then some 7 else if c = '8' then some 8
  else if c = '9' then some 9
  else if c = 'a' ∨ c = 'A' then some 10 else if c = 'b' ∨ c = 'B' then some 11
  else if c = 'c' ∨ c = 'C' then some 12 else if c = 'd' ∨ c = 'D' then some 13
  else if c = 'e' ∨ c = 'E' then some 14 else if c = 'f' ∨ c = 'F' then some 15
  else none

/-- Value of a digit character in base `b` (`b ≤ 16`). -/
def digitVal (b : Nat) (c : Char) : Option Nat :=
  match hexVal c with
  | some d => if d < b then some d else none
  | none => none

/-- Canonical big-endian digits of `n` in base `b`: no leading zeros, `0 ↦ "0"`. -/
def toDigits (b n : Nat) : List Char :=
  if _h : b < 2 ∨ n < b then [digitChar n]
  else toDigits b (n / b) ++ [digitChar (n % b)]
termination_by n
decreasing_by
  have hb : 2 ≤ b := by omega
  have hn : 0 < n := by omega
  exact Nat.div_lt_self hn hb

/-- Exactly `k` big-endian digits of `n mod b^k` (zero padded). -/
def fixedDigits (b : Nat) : Nat → Nat → List Char
  | 0, _ => []
  | k + 1, n => fixedDigits b k (n / b) ++ [digitChar (n % b)]

/-- Strict digit-string reader. Fails on any non-digit of base `b`. -/
def ofDigitsAux (b : Nat) : Nat → List Char → Option Nat
  | acc, [] => some acc
  | acc, c :: cs =>
    match digitVal b c with
    | some d => ofDigitsAux b (acc * b + d) cs
    | none => none

/-- Strict reader that also rejects the empty string. -/
def ofDigits (b : Nat) (cs : List Char) : Option Nat :=
  if cs.isEmpty then none else ofDigitsAux b 0 cs

theorem hexVal_digitChar_fin : ∀ d : Fin 16, hexVal (digitChar d.val) = some d.val := by decide

theorem hexVal_digitChar {d : Nat} (h : d < 16) : hexVal (digitChar d) = some d :=
  hexVal_digitChar_fin ⟨d, h⟩

theorem digitVal_digitChar {b d : Nat} (hd : d < b) (hb : b ≤ 16) :
    digitVal b (digitChar d) = some d := by
  have h16 : d < 16 := by omega
  simp [digitVal, hexVal_digitChar h16, hd]

theorem digitChar_ne_zero_fin : ∀ d : Fin 16, d.val ≠ 0 → digitChar d.val ≠ '0' := by decide

theorem digitChar_ne_zero {d : Nat} (h : d < 16) (h0 : d ≠ 0) : digitChar d ≠ '0' :=
  digitChar_ne_zero_fin ⟨d, h⟩ h0

theorem ofDigitsAux_append (b : Nat) (xs ys : List Char) (acc : Nat) :
    ofDigitsAux b acc (xs ++ ys) = (ofDigitsAux b acc xs).bind (fun a => ofDigitsAux b a ys) := by
  induction xs generalizing acc with
  | nil => simp [ofDigitsAux]
  | cons c cs ih =>
    simp only [List.cons_append, ofDigitsAux]
    cases digitVal b c with
    | none => simp
    | some d => simp [ih]

theorem ofDigitsAux_single {b d : Nat} (hd : d < b) (hb : b ≤ 16) (acc : Nat) :
    ofDigitsAux b acc [digitChar d] = some (acc * b + d) := by
  simp [ofDigitsAux, digitVal_digitChar hd hb]

/-- Reading the canonical digits of `n` yields `n`. -/
theorem ofDigitsAux_toDigits {b : Nat} (hb2 : 2 ≤ b) (hb : b ≤ 16) (n : Nat) :
    ofDigitsAux b 0 (toDigits b n) = some n := by
  induction n using Nat.strongRecOn with
  | _ n ih =>
    rw [toDigits]
    split
    · next h =>
      have hn : n < b := by omega
      simp [ofDigitsAux_single hn hb]
    · next h =>
      have hn : b ≤ n := by omega
      have hlt : n / b < n := Nat.div_lt_self (by omega) hb2
      have hmod : n % b < b := Nat.mod_lt _ (by omega)
      rw [ofDigitsAux_append, ih _ hlt]
      simp [ofDigitsAux_single hmod hb, Nat.div_add_mod']

/-- Canonical digits are non-empty and start with `'0'` only for the number zero. -/
theorem toDigits_head {b : Nat} (hb2 : 2 ≤ b) (hb : b ≤ 16) (n : Nat) :
    ∃ c t, toDigits b n = c :: t ∧ digitVal b c ≠ none ∧ (c = '0' → t = []) := by
  induction n using Nat.strongRecOn with
  | _ n ih =>
    rw [toDigits]
    split
    · next h =>
      have hn : n < b := by omega
      exact ⟨digitChar n, [], rfl, by simp [digitVal_digitChar hn hb], fun _ => rfl⟩
    · next h =>
      have hn : b ≤ n := by omega
      have hlt : n / b < n := Nat.div_lt_self (by omega) hb2
      obtain ⟨c, t, hct, hdig, hz⟩ := ih _ hlt
      refine ⟨c, t ++ [digitChar (n % b)], by simp [hct], hdig, ?_⟩
      intro hc
      -- A leading '0' would force `n / b = 0`, contradicting `b ≤ n`.
      have ht : t = [] := hz hc
      have hval := ofDigitsAux_toDigits hb2 hb (n / b)
      rw [hct, ht, hc] at hval
      have hzero : digitVal b '0' = some 0 := digitVal_digitChar (d := 0) (by omega) hb
      simp [ofDigitsAux, hzero] at hval
      have hpos : 0 < n / b := Nat.div_pos hn (by omega)
      omega

theorem toDigits_all_digits {b : Nat} (hb2 : 2 ≤ b) (hb : b ≤ 16) (n : Nat) :
    ∀ c ∈ toDigits b n, digitVal b c ≠ none := by
  induction n using Nat.strongRecOn with
  | _ n ih =>
    rw [toDigits]
    split
    · next h =>
      have hn : n < b := by omega
      intro c hc
      simp at hc
      simp [hc, digitVal_digitChar hn hb]
    · next h =>
      have hn : b ≤ n := by omega
      have hlt : n / b < n := Nat.div_lt_self (by omega) hb2
      have hmod : n % b < b := Nat.mod_lt _ (by omega)
      intro c hc
      rcases List.mem_append.mp hc with h1 | h1
      · exact ih _ hlt c h1
      · simp at h1
        simp [h1, digitVal_digitChar hmod hb]

theorem fixedDigits_length (b k n : Nat) : (fixedDigits b k n).length = k := by
  induction k generalizing n with
  | zero => rfl
  | succ k ih => simp [fixedDigits, ih]

theorem fixedDigits_all_digits {b : Nat} (hb2 : 2 ≤ b) (hb : b ≤ 16) (k n : Nat) :
    ∀ c ∈ fixedDigits b k n, digitVal b c ≠ none := by
  induction k generalizing n with
  | zero => intro c hc; simp [fixedDigits] at hc
  | succ k ih =>
    have hmod : n % b < b := Nat.mod_lt _ (by omega)
    intro c hc
    rcases List.mem_append.mp hc with h1 | h1
    · exact ih _ c h1
    · simp at h1
      simp [h1, digitVal_digitChar hmod hb]

/-- Reading `k` zero-padded digits appends `n mod b^k` below the accumulator. -/
theorem ofDigitsAux_fixedDigits {b : Nat} (hb2 : 2 ≤ b) (hb : b ≤ 16) (k n acc : Nat) :
    ofDigitsAux b acc (fixedDigits b k n) = some (acc * b ^ k + n % b ^ k) := by
  induction k generalizing n acc with
  | zero => simp [fixedDigits, ofDigitsAux, Nat.mod_one]
  | succ k ih =>
    have hmod : n % b < b := Nat.mod_lt _ (by omega)
    rw [fixedDigits, ofDigitsAux_append, ih]
    simp only [Option.bind_some, ofDigitsAux_single hmod hb]
    have h1 : n % b ^ (k + 1) = n % b + b * (n / b % b ^ k) := by
      rw [Nat.pow_succ, Nat.mul_comm (b ^ k) b, Nat.mod_mul]
    rw [h1, Nat.pow_succ, Nat.add_mul, Nat.mul_assoc]
    congr 1
    rw [Nat.add_assoc]
    congr 1
    rw [Nat.mul_comm (n / b % b ^ k) b, Nat.add_comm]

/-! ## 2. FeeMarket gwei / wei conversion -/

/-- Number of decimal places between gwei and wei. -/
def weiDecimals : Nat := 9

/-- `10^9`: wei per gwei. -/
def weiPerGwei : Nat := 10 ^ weiDecimals

/-- An exact decimal literal: `(-1)^neg * mant * 10^scale`. -/
structure Decimal where
  neg : Bool
  mant : Nat
  scale : Int
  deriving Repr, DecidableEq

/-- Signed mantissa of a decimal literal. -/
def Decimal.signed (d : Decimal) : Int := if d.neg then -(d.mant : Int) else d.mant

/--
`FeeMarket.gweiToWei`: exact base-10 scaling of a gwei amount by `10^9`, flooring any
fractional wei (toward negative infinity). No binary floating point is involved.
-/
def gweiToWei (d : Decimal) : Int :=
  let e := d.scale + weiDecimals
  if 0 ≤ e then d.signed * (10 : Int) ^ e.toNat
  else d.signed / (10 : Int) ^ (-e).toNat

/-- `FeeMarket.weiToGwei` as an exact decimal value. -/
def weiToGweiDecimal (wei : Nat) : Decimal := ⟨false, wei, -9⟩

/-- `FeeMarket.weiToGwei`: `<whole>.<exactly nine fractional digits>`. -/
def weiToGweiChars (wei : Nat) : List Char :=
  toDigits 10 (wei / weiPerGwei) ++ '.' :: fixedDigits 10 weiDecimals (wei % weiPerGwei)

def weiToGwei (wei : Nat) : String := String.ofList (weiToGweiChars wei)

/-- Drop trailing zeros of a fractional digit string. -/
def trimTrailingZeros (cs : List Char) : List Char :=
  (cs.reverse.dropWhile (· == '0')).reverse

/-- Shortest exact rendering (viem `formatGwei`): no trailing fractional zeros. -/
def weiToGweiTrimmed (wei : Nat) : String :=
  let whole := toDigits 10 (wei / weiPerGwei)
  let frac := trimTrailingZeros (fixedDigits 10 weiDecimals (wei % weiPerGwei))
  String.ofList (if frac.isEmpty then whole else whole ++ '.' :: frac)

/-- Longest prefix of decimal digits, and the remainder. -/
def takeDigits : List Char → List Char × List Char
  | [] => ([], [])
  | c :: cs =>
    if digitVal 10 c ≠ none then ((c :: (takeDigits cs).1), (takeDigits cs).2)
    else ([], c :: cs)

/-- Optional exponent suffix: `""`, `e<digits>`, `e+<digits>`, `e-<digits>`. -/
def parseExponent : List Char → Option Int
  | [] => some 0
  | 'e' :: '+' :: ds => (ofDigits 10 ds).map (fun n => (n : Int))
  | 'e' :: '-' :: ds => (ofDigits 10 ds).map (fun n => -(n : Int))
  | 'e' :: ds => (ofDigits 10 ds).map (fun n => (n : Int))
  | _ => none

/-- Unsigned decimal literal `<digits>[.<digits>][e[+-]<digits>]`. -/
def parseUnsignedDecimal (neg : Bool) (cs : List Char) : Option Decimal :=
  let ip := (takeDigits cs).1
  let r1 := (takeDigits cs).2
  if ip.isEmpty then none
  else
    let fr : List Char × List Char :=
      match r1 with
      | '.' :: t => takeDigits t
      | _ => ([], r1)
    match parseExponent fr.2, ofDigitsAux 10 0 (ip ++ fr.1) with
    | some e, some m => some ⟨neg, m, e - (fr.1.length : Int)⟩
    | _, _ => none

/-- Decimal literal in the grammar of ECMAScript `Number.prototype.toString`. -/
def parseDecimalChars : List Char → Option Decimal
  | '-' :: t => parseUnsignedDecimal true t
  | cs => parseUnsignedDecimal false cs

def parseDecimal (s : String) : Option Decimal := parseDecimalChars s.toList

theorem takeDigits_all (xs : List Char) (h : ∀ c ∈ xs, digitVal 10 c ≠ none) :
    takeDigits xs = (xs, []) := by
  induction xs with
  | nil => rfl
  | cons c cs ih =>
    have hc : digitVal 10 c ≠ none := h c (by simp)
    have ht := ih (fun d hd => h d (by simp [hd]))
    simp [takeDigits, hc, ht]

theorem takeDigits_append_cons (xs : List Char) (c : Char) (ys : List Char)
    (h : ∀ d ∈ xs, digitVal 10 d ≠ none) (hc : digitVal 10 c = none) :
    takeDigits (xs ++ c :: ys) = (xs, c :: ys) := by
  induction xs with
  | nil => simp [takeDigits, hc]
  | cons x xs ih =>
    have hx : digitVal 10 x ≠ none := h x (by simp)
    have ht := ih (fun d hd => h d (by simp [hd]))
    simp [takeDigits, hx, ht]

theorem weiToGwei_parts (wei : Nat) :
    wei / weiPerGwei * weiPerGwei + wei % weiPerGwei = wei := Nat.div_add_mod' wei weiPerGwei

/-- Structural round trip: scaling the exact gwei value of `wei` returns `wei`. -/
theorem gweiToWei_weiToGweiDecimal (wei : Nat) : gweiToWei (weiToGweiDecimal wei) = wei := by
  simp [gweiToWei, weiToGweiDecimal, Decimal.signed, weiDecimals]

/-- The rendered gwei string parses back to the exact decimal `wei * 10^-9`. -/
theorem parseDecimalChars_weiToGweiChars (wei : Nat) :
    parseDecimalChars (weiToGweiChars wei) = some (weiToGweiDecimal wei) := by
  have h2 : (2 : Nat) ≤ 10 := by decide
  have h16 : (10 : Nat) ≤ 16 := by decide
  have hDall := toDigits_all_digits h2 h16 (wei / weiPerGwei)
  have hFall := fixedDigits_all_digits h2 h16 weiDecimals (wei % weiPerGwei)
  have hFlen := fixedDigits_length 10 weiDecimals (wei % weiPerGwei)
  obtain ⟨c, t, hct, hcdig, -⟩ := toDigits_head h2 h16 (wei / weiPerGwei)
  have hdot : digitVal 10 '.' = none := by decide
  have hminus : digitVal 10 '-' = none := by decide
  have hcm : c ≠ '-' := by
    intro hc; rw [hc] at hcdig; exact hcdig hminus
  have htake := takeDigits_append_cons _ '.' (fixedDigits 10 weiDecimals (wei % weiPerGwei))
    hDall hdot
  have htakeF := takeDigits_all _ hFall
  have hval : ofDigitsAux 10 0
      (toDigits 10 (wei / weiPerGwei) ++ fixedDigits 10 weiDecimals (wei % weiPerGwei))
      = some wei := by
    rw [ofDigitsAux_append, ofDigitsAux_toDigits h2 h16]
    simp only [Option.bind_some]
    rw [ofDigitsAux_fixedDigits h2 h16]
    have hmm : wei % weiPerGwei % 10 ^ weiDecimals = wei % weiPerGwei := by
      show wei % weiPerGwei % weiPerGwei = _
      exact Nat.mod_mod _ _
    rw [hmm]
    exact congrArg some (weiToGwei_parts wei)
  have hunsigned : parseUnsignedDecimal false (weiToGweiChars wei)
      = some (weiToGweiDecimal wei) := by
    unfold parseUnsignedDecimal weiToGweiChars
    simp only [htake, htakeF, hval, parseExponent, hFlen]
    simp [hct, weiToGweiDecimal, weiDecimals]
  have hshape : weiToGweiChars wei
      = c :: (t ++ '.' :: fixedDigits 10 weiDecimals (wei % weiPerGwei)) := by
    simp [weiToGweiChars, hct]
  rw [← hunsigned, hshape]
  unfold parseDecimalChars
  split
  · next heq => exact absurd (List.cons.inj heq).1 hcm
  · rfl

/-- **FeeMarket round trip.** `gweiToWei (parse (weiToGwei wei)) = wei` for every `wei`. -/
theorem gweiToWei_weiToGwei_roundtrip (wei : Nat) :
    (parseDecimalChars (weiToGweiChars wei)).map gweiToWei = some (wei : Int) := by
  rw [parseDecimalChars_weiToGweiChars, Option.map_some, gweiToWei_weiToGweiDecimal]

/-- Whole gwei scale exactly: `n` gwei is `n * 10^9` wei. -/
theorem gweiToWei_whole (n : Nat) : gweiToWei ⟨false, n, 0⟩ = (n : Int) * 10 ^ 9 := by
  simp [gweiToWei, Decimal.signed, weiDecimals]

/-- Sub-wei amounts floor: the result `w` satisfies `w * q ≤ signed < (w + 1) * q`. -/
theorem gweiToWei_floor (d : Decimal) (h : d.scale + weiDecimals < 0) :
    gweiToWei d * (10 : Int) ^ (-(d.scale + weiDecimals)).toNat ≤ d.signed ∧
    d.signed < (gweiToWei d + 1) * (10 : Int) ^ (-(d.scale + weiDecimals)).toNat := by
  have hq : (0 : Int) < (10 : Int) ^ (-(d.scale + weiDecimals)).toNat :=
    Int.pow_pos (by decide)
  have hne : ¬ (0 ≤ d.scale + (weiDecimals : Int)) := by omega
  simp only [gweiToWei, hne, if_false]
  exact ⟨Int.ediv_mul_le _ (Int.ne_of_gt hq), Int.lt_ediv_add_one_mul_self _ hq⟩

/-! ## 3. Hardforks and precompile dispatch -/

/-- Execution-layer hardforks in activation order. -/
inductive Fork
  | frontier | homestead | dao | tangerineWhistle | spuriousDragon | byzantium
  | constantinople | petersburg | istanbul | muirGlacier | berlin | london
  | arrowGlacier | grayGlacier | merge | shanghai | cancun | prague | osaka | amsterdam
  deriving DecidableEq, Repr

/-- Position in the activation order. -/
def Fork.ord : Fork → Nat
  | .frontier => 0 | .homestead => 1 | .dao => 2 | .tangerineWhistle => 3
  | .spuriousDragon => 4 | .byzantium => 5 | .constantinople => 6 | .petersburg => 7
  | .istanbul => 8 | .muirGlacier => 9 | .berlin => 10 | .london => 11
  | .arrowGlacier => 12 | .grayGlacier => 13 | .merge => 14 | .shanghai => 15
  | .cancun => 16 | .prague => 17 | .osaka => 18 | .amsterdam => 19

/-- `fork` is at or after `activation`. -/
def Fork.isAtLeast (fork activation : Fork) : Bool := activation.ord ≤ fork.ord

def Fork.all : List Fork :=
  [.frontier, .homestead, .dao, .tangerineWhistle, .spuriousDragon, .byzantium,
   .constantinople, .petersburg, .istanbul, .muirGlacier, .berlin, .london,
   .arrowGlacier, .grayGlacier, .merge, .shanghai, .cancun, .prague, .osaka, .amsterdam]

/-- The seven BLS12-381 operations of final EIP-2537. -/
inductive BlsOp
  | g1Add | g1Msm | g2Add | g2Msm | pairingCheck | mapFpToG1 | mapFp2ToG2
  deriving DecidableEq, Repr

def BlsOp.all : List BlsOp :=
  [.g1Add, .g1Msm, .g2Add, .g2Msm, .pairingCheck, .mapFpToG1, .mapFp2ToG2]

/-- Final EIP-2537 address of each operation. -/
def BlsOp.addr : BlsOp → Nat
  | .g1Add => 0x0b | .g1Msm => 0x0c | .g2Add => 0x0d | .g2Msm => 0x0e
  | .pairingCheck => 0x0f | .mapFpToG1 => 0x10 | .mapFp2ToG2 => 0x11

/-- Address dispatch for the BLS12-381 precompiles. -/
def blsOpOfAddr (a : Nat) : Option BlsOp :=
  if a = 0x0b then some .g1Add else if a = 0x0c then some .g1Msm
  else if a = 0x0d then some .g2Add else if a = 0x0e then some .g2Msm
  else if a = 0x0f then some .pairingCheck else if a = 0x10 then some .mapFpToG1
  else if a = 0x11 then some .mapFp2ToG2 else none

/-- A BLS12-381 precompile is callable at `a` under `fork`. -/
def blsActive (a : Nat) (fork : Fork) : Bool :=
  (blsOpOfAddr a).isSome && fork.isAtLeast .prague

/-- Every precompile known to the dispatch table. -/
inductive Precompile
  | ecrecover | sha256 | ripemd160 | identity | modexp | bn254Add | bn254Mul
  | bn254Pairing | blake2f | pointEvaluation | bls (op : BlsOp) | p256Verify
  deriving DecidableEq, Repr

def Precompile.addr : Precompile → Nat
  | .ecrecover => 1 | .sha256 => 2 | .ripemd160 => 3 | .identity => 4 | .modexp => 5
  | .bn254Add => 6 | .bn254Mul => 7 | .bn254Pairing => 8 | .blake2f => 9
  | .pointEvaluation => 0x0a | .bls op => op.addr | .p256Verify => 0x100

/-- Fork that activates each precompile. -/
def Precompile.activation : Precompile → Fork
  | .ecrecover | .sha256 | .ripemd160 | .identity => .frontier
  | .modexp | .bn254Add | .bn254Mul | .bn254Pairing => .byzantium
  | .blake2f => .istanbul
  | .pointEvaluation => .cancun
  | .bls _ => .prague
  | .p256Verify => .osaka

def precompileOfAddr (a : Nat) : Option Precompile :=
  if a = 1 then some .ecrecover else if a = 2 then some .sha256
  else if a = 3 then some .ripemd160 else if a = 4 then some .identity
  else if a = 5 then some .modexp else if a = 6 then some .bn254Add
  else if a = 7 then some .bn254Mul else if a = 8 then some .bn254Pairing
  else if a = 9 then some .blake2f else if a = 0x0a then some .pointEvaluation
  else if a = 0x100 then some .p256Verify
  else (blsOpOfAddr a).map .bls

/-- `isPrecompile(address, hardfork)`. -/
def isPrecompile (a : Nat) (fork : Fork) : Bool :=
  match precompileOfAddr a with
  | some p => fork.isAtLeast p.activation
  | none => false

/-- Dispatch is a left inverse of the address table. -/
theorem blsOpOfAddr_addr (op : BlsOp) : blsOpOfAddr op.addr = some op := by
  cases op <;> rfl

/-- Dispatch only ever returns the operation that owns the address. -/
theorem blsOpOfAddr_sound {a : Nat} {op : BlsOp} (h : blsOpOfAddr a = some op) : op.addr = a := by
  unfold blsOpOfAddr at h
  repeat' split at h
  all_goals first
    | (cases h; simp_all [BlsOp.addr])
    | contradiction

/-- **Disjointness.** Distinct operations have distinct addresses. -/
theorem BlsOp.addr_injective {x y : BlsOp} (h : x.addr = y.addr) : x = y := by
  have hx := blsOpOfAddr_addr x
  rw [h, blsOpOfAddr_addr y] at hx
  exact (Option.some.inj hx).symm

/-- **Completeness.** The dispatched addresses are exactly `0x0b..0x11`. -/
theorem blsOpOfAddr_isSome_iff (a : Nat) : (blsOpOfAddr a).isSome ↔ 0x0b ≤ a ∧ a ≤ 0x11 := by
  constructor
  · intro h
    cases hop : blsOpOfAddr a with
    | none => simp [hop] at h
    | some op =>
      have := blsOpOfAddr_sound hop
      cases op <;> simp [BlsOp.addr] at this <;> omega
  · intro ⟨h1, h2⟩
    have : a = 0x0b ∨ a = 0x0c ∨ a = 0x0d ∨ a = 0x0e ∨ a = 0x0f ∨ a = 0x10 ∨ a = 0x11 := by
      omega
    rcases this with h | h | h | h | h | h | h <;> subst h <;> rfl

/-- Exactly seven operations, each listed once. -/
theorem BlsOp.all_complete (op : BlsOp) : op ∈ BlsOp.all := by
  cases op <;> simp [BlsOp.all]

theorem BlsOp.all_length : BlsOp.all.length = 7 := rfl

theorem BlsOp.all_addrs : BlsOp.all.map BlsOp.addr = [0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11] :=
  rfl

/-- The two addresses of the superseded nine-operation draft are not precompiles. -/
theorem bls_0x12_rejected (fork : Fork) : isPrecompile 0x12 fork = false := rfl

theorem bls_0x13_rejected (fork : Fork) : isPrecompile 0x13 fork = false := rfl

/-- **Fork gating.** A BLS12-381 address is active exactly from Prague. -/
theorem blsActive_iff (a : Nat) (fork : Fork) :
    blsActive a fork = true ↔ (0x0b ≤ a ∧ a ≤ 0x11) ∧ Fork.prague.ord ≤ fork.ord := by
  simp [blsActive, blsOpOfAddr_isSome_iff, Fork.isAtLeast]

theorem bls_inactive_before_prague (a : Nat) (fork : Fork) (h : fork.ord < Fork.prague.ord) :
    blsActive a fork = false := by
  have hne : ¬ (Fork.prague.ord ≤ fork.ord) := by omega
  cases hb : blsActive a fork with
  | false => rfl
  | true => exact absurd ((blsActive_iff a fork).mp hb).2 hne

/-- The generic table agrees with the BLS table on the BLS range. -/
theorem isPrecompile_bls (op : BlsOp) (fork : Fork) :
    isPrecompile op.addr fork = fork.isAtLeast .prague := by
  cases op <;> rfl

/-- The generic table round-trips every precompile (so all 18 addresses are distinct). -/
theorem precompileOfAddr_addr (p : Precompile) : precompileOfAddr p.addr = some p := by
  cases p with
  | bls op => cases op <;> rfl
  | _ => rfl

theorem Precompile.addr_injective {x y : Precompile} (h : x.addr = y.addr) : x = y := by
  have hx := precompileOfAddr_addr x
  rw [h, precompileOfAddr_addr y] at hx
  exact (Option.some.inj hx).symm

/-! ## 4. EIP-7951 P256VERIFY -/

namespace P256

/-- Precompile address `0x100`. -/
def address : Nat := 0x100

/-- Fixed gas cost. -/
def gas : Nat := 6900

/-- Exact input length: `h ‖ r ‖ s ‖ qx ‖ qy`, 32 bytes each. -/
def inputLength : Nat := 160

/-- Base field modulus. -/
def p : Nat := 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
/-- Curve coefficient `a = p - 3`. -/
def a : Nat := 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc
/-- Curve coefficient `b`. -/
def b : Nat := 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b
/-- Subgroup order. -/
def n : Nat := 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551
def gx : Nat := 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296
def gy : Nat := 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5

/-- Big-endian unsigned integer of a byte string. -/
def beNat (bs : List UInt8) : Nat := bs.foldl (fun acc x => acc * 256 + x.toNat) 0

/-- The 32-byte word at `offset`. -/
def word (input : List UInt8) (offset : Nat) : Nat := beNat ((input.drop offset).take 32)

/-- Decoded input fields. -/
structure Fields where
  h : Nat
  r : Nat
  s : Nat
  qx : Nat
  qy : Nat
  deriving Repr, DecidableEq

/-- Framing: the input must be exactly 160 bytes. -/
def decode (input : List UInt8) : Option Fields :=
  if input.length = inputLength then
    some ⟨word input 0, word input 32, word input 64, word input 96, word input 128⟩
  else none

/-- Modular exponentiation by squaring. -/
def powMod (base e m : Nat) : Nat :=
  if h : e = 0 then 1 % m
  else
    let half := powMod base (e / 2) m
    let sq := half * half % m
    if e % 2 = 1 then sq * base % m else sq
termination_by e
decreasing_by omega

/-- Inverse modulo a prime (Fermat). -/
def invMod (x m : Nat) : Nat := powMod x (m - 2) m

/-- Modular subtraction for reduced operands. -/
def subMod (x y m : Nat) : Nat := (x + m - y % m) % m

/-- `y² = x³ + a·x + b (mod p)`. -/
def onCurve (x y : Nat) : Bool := y * y % p == (x * x * x + a * x + b) % p

/-- Jacobian point `(X, Y, Z)` for the affine point `(X/Z², Y/Z³)`; `Z = 0` is infinity. -/
structure Jacobian where
  x : Nat
  y : Nat
  z : Nat
  deriving Repr

def Jacobian.infinity : Jacobian := ⟨1, 1, 0⟩

def Jacobian.ofAffine (x y : Nat) : Jacobian := ⟨x % p, y % p, 1⟩

/-- Point doubling. -/
def Jacobian.double (P : Jacobian) : Jacobian :=
  if P.z = 0 ∨ P.y = 0 then .infinity
  else
    let yy := P.y * P.y % p
    let s := 4 * P.x * yy % p
    let zz := P.z * P.z % p
    let m := (3 * P.x * P.x + a * (zz * zz % p)) % p
    let x3 := subMod (m * m % p) (2 * s) p
    let y3 := subMod (m * subMod s x3 p % p) (8 * (yy * yy % p)) p
    ⟨x3, y3, 2 * P.y * P.z % p⟩

/-- Point addition. -/
def Jacobian.add (P Q : Jacobian) : Jacobian :=
  if P.z = 0 then Q
  else if Q.z = 0 then P
  else
    let z1z1 := P.z * P.z % p
    let z2z2 := Q.z * Q.z % p
    let u1 := P.x * z2z2 % p
    let u2 := Q.x * z1z1 % p
    let s1 := P.y * (Q.z * z2z2 % p) % p
    let s2 := Q.y * (P.z * z1z1 % p) % p
    if u1 = u2 then
      if s1 = s2 then P.double else .infinity
    else
      let h := subMod u2 u1 p
      let r := subMod s2 s1 p
      let hh := h * h % p
      let hhh := h * hh % p
      let v := u1 * hh % p
      let x3 := subMod (subMod (r * r % p) hhh p) (2 * v) p
      let y3 := subMod (r * subMod v x3 p % p) (s1 * hhh) p
      ⟨x3, y3, h * (P.z * Q.z % p) % p⟩

/-- Double-and-add scalar multiplication. -/
def Jacobian.mul (k : Nat) (P : Jacobian) : Jacobian :=
  if h : k = 0 then .infinity
  else
    let dbl := (Jacobian.mul (k / 2) P).double
    if k % 2 = 1 then dbl.add P else dbl
termination_by k
decreasing_by omega

/-- Affine `x` coordinate, or `none` at infinity. -/
def Jacobian.affineX (P : Jacobian) : Option Nat :=
  if P.z = 0 then none
  else
    let zInv := invMod P.z p
    some (P.x * (zInv * zInv % p) % p)

/-- ECDSA verification equation: `(h·s⁻¹)G + (r·s⁻¹)Q` has `x ≡ r (mod n)`. -/
def ecdsaValid (f : Fields) : Bool :=
  let sInv := invMod f.s n
  let u1 := f.h * sInv % n
  let u2 := f.r * sInv % n
  let R := (Jacobian.mul u1 (.ofAffine gx gy)).add (Jacobian.mul u2 (.ofAffine f.qx f.qy))
  match R.affineX with
  | none => false
  | some x => x % n == f.r

/-- Outcome of the EIP-7951 input checks, in the order the EIP performs them. -/
inductive Check
  | badLength | badScalar | badField | infinity | offCurve | badSignature | valid
  deriving DecidableEq, Repr

def classify (input : List UInt8) : Check :=
  match decode input with
  | none => .badLength
  | some f =>
    if f.r = 0 ∨ n ≤ f.r ∨ f.s = 0 ∨ n ≤ f.s then .badScalar
    else if p ≤ f.qx ∨ p ≤ f.qy then .badField
    else if f.qx = 0 ∧ f.qy = 0 then .infinity
    else if onCurve f.qx f.qy = false then .offCurve
    else if ecdsaValid f = false then .badSignature
    else .valid

/-- Result of a precompile call. -/
structure Result where
  success : Bool
  gasUsed : Nat
  output : List UInt8
  deriving Repr, DecidableEq

/-- 32-byte big-endian `1`. -/
def one32 : List UInt8 := List.replicate 31 0 ++ [1]

/-- The precompile body: charge 6900 gas up front, then never revert. -/
def run (input : List UInt8) (gasLimit : Nat) : Result :=
  if gasLimit < gas then ⟨false, gasLimit, []⟩
  else if classify input = .valid then ⟨true, gas, one32⟩
  else ⟨true, gas, []⟩

/-- Fork-gated call: `none` when `0x100` is an ordinary account (before Osaka). -/
def execute (fork : Fork) (input : List UInt8) (gasLimit : Nat) : Option Result :=
  if fork.isAtLeast .osaka then some (run input gasLimit) else none

/-- **Length.** Only 160-byte inputs decode. -/
theorem decode_isSome_iff (input : List UInt8) :
    (decode input).isSome ↔ input.length = 160 := by
  unfold decode inputLength
  split <;> simp_all

/-- Everything a valid input must satisfy, read off the classifier. -/
theorem classify_valid {input : List UInt8} (h : classify input = .valid) :
    ∃ f, decode input = some f ∧
      (1 ≤ f.r ∧ f.r < n) ∧ (1 ≤ f.s ∧ f.s < n) ∧ (f.qx < p ∧ f.qy < p) ∧
      ¬ (f.qx = 0 ∧ f.qy = 0) ∧ onCurve f.qx f.qy = true ∧ ecdsaValid f = true := by
  unfold classify at h
  split at h
  · cases h
  · next f hf =>
    refine ⟨f, hf, ?_⟩
    split at h
    · cases h
    · next hs =>
      split at h
      · cases h
      · next hfld =>
        split at h
        · cases h
        · next hinf =>
          split at h
          · cases h
          · next hcurve =>
            split at h
            · cases h
            · next hsig =>
              refine ⟨by omega, by omega, by omega, hinf, ?_, ?_⟩
              · cases hc : onCurve f.qx f.qy <;> simp_all
              · cases hc : ecdsaValid f <;> simp_all

/-- **Length.** A valid input is exactly 160 bytes. -/
theorem classify_valid_length {input : List UInt8} (h : classify input = .valid) :
    input.length = 160 := by
  obtain ⟨f, hf, -⟩ := classify_valid h
  exact (decode_isSome_iff input).mp (by simp [hf])

/-- **Scalar bounds.** A valid input has `1 ≤ r, s < n`. -/
theorem classify_valid_scalars {input : List UInt8} (h : classify input = .valid) :
    ∃ f, decode input = some f ∧ 1 ≤ f.r ∧ f.r < n ∧ 1 ≤ f.s ∧ f.s < n := by
  obtain ⟨f, hf, hr, hs, -⟩ := classify_valid h
  exact ⟨f, hf, hr.1, hr.2, hs.1, hs.2⟩

/-- **Field bounds.** A valid input has `0 ≤ qx, qy < p`. -/
theorem classify_valid_field {input : List UInt8} (h : classify input = .valid) :
    ∃ f, decode input = some f ∧ 0 ≤ f.qx ∧ f.qx < p ∧ 0 ≤ f.qy ∧ f.qy < p := by
  obtain ⟨f, hf, -, -, hq, -⟩ := classify_valid h
  exact ⟨f, hf, Nat.zero_le _, hq.1, Nat.zero_le _, hq.2⟩

/-- Wrong-length inputs are classified as such, never as valid. -/
theorem classify_badLength {input : List UInt8} (h : input.length ≠ 160) :
    classify input = .badLength := by
  unfold classify decode inputLength
  simp [h]

/-- **Gas.** With enough gas the charge is exactly 6900 and the call succeeds. -/
theorem run_gas {input : List UInt8} {gasLimit : Nat} (h : 6900 ≤ gasLimit) :
    (run input gasLimit).gasUsed = 6900 ∧ (run input gasLimit).success = true := by
  have hg : ¬ gasLimit < gas := by unfold gas; omega
  unfold run
  simp only [hg, if_false]
  split <;> exact ⟨rfl, rfl⟩

/-- **Gas.** Below 6900 the call halts out of gas, consuming all forwarded gas. -/
theorem run_out_of_gas {input : List UInt8} {gasLimit : Nat} (h : gasLimit < 6900) :
    run input gasLimit = ⟨false, gasLimit, []⟩ := by
  have hg : gasLimit < gas := by unfold gas; omega
  simp [run, hg]

/-- **Gas.** The charge never exceeds the forwarded gas. -/
theorem run_gasUsed_le (input : List UInt8) (gasLimit : Nat) :
    (run input gasLimit).gasUsed ≤ gasLimit := by
  unfold run
  split
  · exact Nat.le_refl _
  · next hg => split <;> exact Nat.le_of_not_lt hg

/-- The output is the 32-byte word `1` exactly for valid inputs, otherwise empty. -/
theorem run_output (input : List UInt8) (gasLimit : Nat) :
    (run input gasLimit).output =
      if gas ≤ gasLimit ∧ classify input = .valid then one32 else [] := by
  unfold run
  by_cases hg : gasLimit < gas
  · have : ¬ gas ≤ gasLimit := by omega
    simp [hg, this]
  · have : gas ≤ gasLimit := by omega
    by_cases hv : classify input = .valid <;> simp [hg, this, hv]

theorem one32_length : one32.length = 32 := rfl

/-- A successful non-empty output implies every framing and bound check passed. -/
theorem run_one32_sound {input : List UInt8} {gasLimit : Nat}
    (h : (run input gasLimit).output = one32) :
    input.length = 160 ∧ ∃ f, decode input = some f ∧
      1 ≤ f.r ∧ f.r < n ∧ 1 ≤ f.s ∧ f.s < n ∧ f.qx < p ∧ f.qy < p := by
  rw [run_output] at h
  split at h
  · next hc =>
    obtain ⟨f, hf, hr, hs, hq, -⟩ := classify_valid hc.2
    exact ⟨classify_valid_length hc.2, f, hf, hr.1, hr.2, hs.1, hs.2, hq.1, hq.2⟩
  · exact absurd h.symm (by decide)

/-- **Fork gating.** `0x100` is a precompile exactly from Osaka. -/
theorem execute_isSome_iff (fork : Fork) (input : List UInt8) (gasLimit : Nat) :
    (execute fork input gasLimit).isSome ↔ Fork.osaka.ord ≤ fork.ord := by
  unfold execute
  split <;> simp_all [Fork.isAtLeast]

theorem execute_before_osaka {fork : Fork} (h : fork.ord < Fork.osaka.ord)
    (input : List UInt8) (gasLimit : Nat) : execute fork input gasLimit = none := by
  have hne : ¬ (Fork.osaka.ord ≤ fork.ord) := by omega
  simp [execute, Fork.isAtLeast, hne]

/-- The dispatch table gates `0x100` on the same fork. -/
theorem isPrecompile_p256 (fork : Fork) :
    isPrecompile address fork = fork.isAtLeast .osaka := rfl

end P256

/-! ## 5. JSON-RPC Quantity and Data hex codecs -/

/-- Canonical `Quantity`: `0x` then minimal lowercase hex digits (`0 ↦ "0x0"`). -/
def encodeQuantityChars (n : Nat) : List Char := '0' :: 'x' :: toDigits 16 n

def encodeQuantity (n : Nat) : String := String.ofList (encodeQuantityChars n)

/--
Strict `Quantity` parser. Rejects a missing or uppercase `0x` prefix, the empty digit
string, a sign, any non-hex character, and leading zeros (only `0x0` may start with `0`).
Hex digits may be either case.
-/
def parseQuantityChars : List Char → Option Nat
  | '0' :: 'x' :: ds =>
    if ds.isEmpty then none
    else if ds.head? = some '0' ∧ ds.length ≠ 1 then none
    else ofDigitsAux 16 0 ds
  | _ => none

def parseQuantity (s : String) : Option Nat := parseQuantityChars s.toList

/-- Largest `u256`. -/
def maxU256 : Nat := 2 ^ 256 - 1

/-- Strict `Quantity` parser bounded to `u256`. -/
def parseQuantityU256 (s : String) : Option Nat :=
  match parseQuantity s with
  | some n => if n ≤ maxU256 then some n else none
  | none => none

/-- **Quantity round trip.** Parsing the canonical encoding returns the number. -/
theorem parseQuantityChars_encode (n : Nat) :
    parseQuantityChars (encodeQuantityChars n) = some n := by
  obtain ⟨c, t, hct, -, hz⟩ := toDigits_head (b := 16) (by decide) (by decide) n
  have hval := ofDigitsAux_toDigits (b := 16) (by decide) (by decide) n
  unfold parseQuantityChars encodeQuantityChars
  simp only [hct] at hval ⊢
  have hlead : ¬ ((c :: t).head? = some '0' ∧ (c :: t).length ≠ 1) := by
    intro ⟨h1, h2⟩
    have hc : c = '0' := by simpa using h1
    have ht := hz hc
    simp [ht] at h2
  simp only [List.isEmpty_cons, Bool.false_eq_true, if_false, hlead, hval]

theorem parseQuantity_encodeQuantity (n : Nat) : parseQuantity (encodeQuantity n) = some n := by
  simp [parseQuantity, encodeQuantity, parseQuantityChars_encode]

theorem parseQuantityU256_encodeQuantity {n : Nat} (h : n ≤ maxU256) :
    parseQuantityU256 (encodeQuantity n) = some n := by
  simp [parseQuantityU256, parseQuantity_encodeQuantity, h]

/-- A bounded parse never returns a value above `2^256 - 1`. -/
theorem parseQuantityU256_le {s : String} {n : Nat} (h : parseQuantityU256 s = some n) :
    n ≤ maxU256 := by
  unfold parseQuantityU256 at h
  split at h
  · split at h
    · next hle => cases h; exact hle
    · cases h
  · cases h

/-- **Strictness.** Leading zeros are rejected (`0x0` itself is the only exception). -/
theorem parseQuantityChars_leading_zero (c : Char) (t : List Char) :
    parseQuantityChars ('0' :: 'x' :: '0' :: c :: t) = none := by
  simp [parseQuantityChars]

/-- **Strictness.** The bare prefix is not a quantity. -/
theorem parseQuantityChars_empty : parseQuantityChars ['0', 'x'] = none := rfl

/-- **Strictness.** A sign is rejected: negative numbers have no encoding. -/
theorem parseQuantityChars_negative (t : List Char) : parseQuantityChars ('-' :: t) = none := rfl

/-- **Strictness.** A string without the `0x` prefix is rejected. -/
theorem parseQuantityChars_requires_prefix {cs : List Char}
    (h : ∀ ds, cs ≠ '0' :: 'x' :: ds) : parseQuantityChars cs = none := by
  unfold parseQuantityChars
  split
  · next ds => exact absurd rfl (h ds)
  · rfl

/-- **Strictness.** Any non-hex character makes the parse fail. -/
theorem ofDigitsAux_non_digit (b acc : Nat) (xs : List Char) (c : Char) (ys : List Char)
    (hc : digitVal b c = none) : ofDigitsAux b acc (xs ++ c :: ys) = none := by
  rw [ofDigitsAux_append]
  cases ofDigitsAux b acc xs with
  | none => rfl
  | some v => simp [ofDigitsAux, hc]

theorem parseQuantityChars_non_hex (xs : List Char) (c : Char) (ys : List Char)
    (hc : digitVal 16 c = none) : parseQuantityChars ('0' :: 'x' :: (xs ++ c :: ys)) = none := by
  unfold parseQuantityChars
  simp only []
  split
  · rfl
  · split
    · rfl
    · exact ofDigitsAux_non_digit 16 0 xs c ys hc

/-- Canonical `Data`: `0x` then two lowercase hex digits per byte. -/
def encodeDataChars (bs : List UInt8) : List Char :=
  '0' :: 'x' :: bs.flatMap (fun x => [digitChar (x.toNat / 16), digitChar (x.toNat % 16)])

def encodeData (bs : List UInt8) : String := String.ofList (encodeDataChars bs)

/-- Byte pairs of a hex digit string; fails on odd length or a non-hex character. -/
def parseHexPairs : List Char → Option (List UInt8)
  | [] => some []
  | [_] => none
  | hi :: lo :: t =>
    match hexVal hi, hexVal lo, parseHexPairs t with
    | some h, some l, some rest => some (UInt8.ofNat (h * 16 + l) :: rest)
    | _, _, _ => none

/-- Strict `Data` parser: `0x` prefix, even digit count, hex digits only. -/
def parseDataChars : List Char → Option (List UInt8)
  | '0' :: 'x' :: ds => parseHexPairs ds
  | _ => none

def parseData (s : String) : Option (List UInt8) := parseDataChars s.toList

theorem byte_split (x : UInt8) : UInt8.ofNat (x.toNat / 16 * 16 + x.toNat % 16) = x := by
  rw [Nat.div_add_mod']
  exact UInt8.ofNat_toNat

/-- **Data round trip.** Parsing the canonical encoding returns the bytes. -/
theorem parseDataChars_encode (bs : List UInt8) :
    parseDataChars (encodeDataChars bs) = some bs := by
  unfold parseDataChars encodeDataChars
  simp only []
  induction bs with
  | nil => rfl
  | cons x xs ih =>
    have hx : x.toNat < 256 := x.toNat_lt
    have hhi : x.toNat / 16 < 16 := by omega
    have hlo : x.toNat % 16 < 16 := by omega
    simp only [List.flatMap_cons, List.cons_append, List.nil_append, parseHexPairs,
      hexVal_digitChar hhi, hexVal_digitChar hlo, ih, byte_split]

theorem parseData_encodeData (bs : List UInt8) : parseData (encodeData bs) = some bs := by
  simp [parseData, encodeData, parseDataChars_encode]

/-- **Strictness.** An odd number of digits is not `Data`. -/
theorem parseDataChars_odd (c : Char) : parseDataChars ['0', 'x', c] = none := rfl

/-! ## 6. Checked u256 fee / value arithmetic -/

/-- `a + b`, or `none` if it exceeds `2^256 - 1`. -/
def checkedAdd (a b : Nat) : Option Nat := if a + b ≤ maxU256 then some (a + b) else none

/-- `a * b`, or `none` if it exceeds `2^256 - 1`. -/
def checkedMul (a b : Nat) : Option Nat := if a * b ≤ maxU256 then some (a * b) else none

/-- `a - b`, or `none` if it would be negative. -/
def checkedSub (a b : Nat) : Option Nat := if b ≤ a then some (a - b) else none

/-- Up-front transaction cost `gasLimit * maxFeePerGas + value`, checked at every step. -/
def checkedTxCost (gasLimit maxFeePerGas value : Nat) : Option Nat :=
  (checkedMul gasLimit maxFeePerGas).bind (fun fee => checkedAdd fee value)

/-- **No wrap.** A checked sum is the mathematical sum and fits `u256`. -/
theorem checkedAdd_some {a b r : Nat} (h : checkedAdd a b = some r) :
    r = a + b ∧ r ≤ maxU256 := by
  unfold checkedAdd at h
  split at h
  · next hle => cases h; exact ⟨rfl, hle⟩
  · cases h

/-- **No overflow.** The sum is rejected exactly when it exceeds `2^256 - 1`. -/
theorem checkedAdd_none_iff (a b : Nat) : checkedAdd a b = none ↔ maxU256 < a + b := by
  unfold checkedAdd
  split <;> simp <;> omega

/-- **No wrap.** A checked product is the mathematical product and fits `u256`. -/
theorem checkedMul_some {a b r : Nat} (h : checkedMul a b = some r) :
    r = a * b ∧ r ≤ maxU256 := by
  unfold checkedMul at h
  split at h
  · next hle => cases h; exact ⟨rfl, hle⟩
  · cases h

/-- **No overflow.** The product is rejected exactly when it exceeds `2^256 - 1`. -/
theorem checkedMul_none_iff (a b : Nat) : checkedMul a b = none ↔ maxU256 < a * b := by
  unfold checkedMul
  split <;> simp <;> omega

/-- **No wrap.** A checked difference is exact: adding `b` back returns `a`. -/
theorem checkedSub_some {a b r : Nat} (h : checkedSub a b = some r) :
    r + b = a ∧ r ≤ a := by
  unfold checkedSub at h
  split at h
  · cases h; omega
  · cases h

/-- **No underflow.** The difference is rejected exactly when `a < b`. -/
theorem checkedSub_none_iff (a b : Nat) : checkedSub a b = none ↔ a < b := by
  unfold checkedSub
  split <;> simp <;> omega

/-- Checked results never equal the wrapped (mod `2^256`) value unless no wrap occurred. -/
theorem checkedAdd_ne_wrapped {a b r : Nat} (h : checkedAdd a b = some r) :
    r = (a + b) % 2 ^ 256 := by
  obtain ⟨hr, hle⟩ := checkedAdd_some h
  have : a + b < 2 ^ 256 := by unfold maxU256 at hle; omega
  rw [hr, Nat.mod_eq_of_lt this]

theorem checkedMul_ne_wrapped {a b r : Nat} (h : checkedMul a b = some r) :
    r = (a * b) % 2 ^ 256 := by
  obtain ⟨hr, hle⟩ := checkedMul_some h
  have : a * b < 2 ^ 256 := by unfold maxU256 at hle; omega
  rw [hr, Nat.mod_eq_of_lt this]

/-- Subtraction undoes checked addition. -/
theorem checkedSub_checkedAdd {a b r : Nat} (h : checkedAdd a b = some r) :
    checkedSub r b = some a := by
  obtain ⟨hr, -⟩ := checkedAdd_some h
  unfold checkedSub
  have : b ≤ r := by omega
  simp [this]; omega

/-- **Fee safety.** A checked transaction cost is exact and fits `u256`. -/
theorem checkedTxCost_some {g f v r : Nat} (h : checkedTxCost g f v = some r) :
    r = g * f + v ∧ r ≤ maxU256 ∧ g * f ≤ maxU256 := by
  unfold checkedTxCost at h
  cases hm : checkedMul g f with
  | none => simp [hm] at h
  | some fee =>
    simp only [hm, Option.bind_some] at h
    obtain ⟨hfee, hfeele⟩ := checkedMul_some hm
    obtain ⟨hr, hrle⟩ := checkedAdd_some h
    exact ⟨by omega, hrle, by omega⟩

/-- The cost is rejected exactly when the exact value does not fit `u256`. -/
theorem checkedTxCost_none_iff (g f v : Nat) :
    checkedTxCost g f v = none ↔ maxU256 < g * f + v := by
  unfold checkedTxCost checkedMul checkedAdd
  by_cases h1 : g * f ≤ maxU256
  · by_cases h2 : g * f + v ≤ maxU256
    · simp [h1, h2]
    · simp [h1, h2]; omega
  · simp [h1]; omega

end PrimitivesSpec
