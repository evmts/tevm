/-!
# Fusaka (Osaka) protocol math: executable reference specification

Pure Lean 4 core, no dependencies. Every definition is executable and is the
oracle behind the `protocol-spec` CLI (`Main.lean`), which `diff-fuzz.test.mjs`
runs against Voltaire's TypeScript implementation and TEVM's native ZEVM engine.

* EIP-7939  `CLZ` opcode
* EIP-7825  transaction gas limit cap (2^24)
* EIP-7934  RLP execution block size cap (8 MiB)
* EIP-4844 / EIP-7691 / EIP-7892 / EIP-7918  blob fee market
* EIP-2565 / EIP-7823 / EIP-7883  ModExp bounds and gas

Every theorem is fully proved, using only Lean's three standard axioms
(`propext`, `Quot.sound`, `Classical.choice`).
-/

namespace ProtocolSpec

/-! ## Forks -/

/-- Execution forks from Berlin onward, in activation order. -/
inductive Fork where
  | berlin | london | merge | shanghai | cancun | prague | osaka | amsterdam
  deriving Repr, DecidableEq, Inhabited

/-- Position of a fork in activation order. -/
def Fork.toNat : Fork → Nat
  | .berlin => 0 | .london => 1 | .merge => 2 | .shanghai => 3
  | .cancun => 4 | .prague => 5 | .osaka => 6 | .amsterdam => 7

/-- `f.isAtLeast g`: fork `f` is `g` or a later fork. -/
def Fork.isAtLeast (f g : Fork) : Bool := decide (g.toNat ≤ f.toNat)

/-- The Fusaka gate: Osaka or later. -/
def Fork.isOsaka (f : Fork) : Bool := f.isAtLeast .osaka

def Fork.ofString? : String → Option Fork
  | "berlin" => some .berlin | "london" => some .london | "merge" => some .merge
  | "shanghai" => some .shanghai | "cancun" => some .cancun | "prague" => some .prague
  | "osaka" => some .osaka | "amsterdam" => some .amsterdam
  | _ => none

theorem Fork.isOsaka_iff (f : Fork) : f.isOsaka = true ↔ f = .osaka ∨ f = .amsterdam := by
  cases f <;> simp [Fork.isOsaka, Fork.isAtLeast, Fork.toNat]

/-! ## EIP-7939: CLZ -/

/-- Number of bits needed to write `x` in binary (`0` for `0`). -/
def bitLength (x : Nat) : Nat := if x = 0 then 0 else Nat.log2 x + 1

/-- Leading zero bits of `x` viewed as a 256-bit word. -/
def clz256 (x : Nat) : Nat := 256 - bitLength x

/-- The `CLZ` opcode (0x1e): undefined before Osaka, `clz256` of the word after. -/
def clzOpcode (f : Fork) (x : Nat) : Option Nat :=
  if f.isOsaka then some (clz256 (x % 2 ^ 256)) else none

/-- EIP-7939 prices `CLZ` like `MUL`. -/
def clzGas : Nat := 5

theorem bitLength_mono {x y : Nat} (h : x ≤ y) : bitLength x ≤ bitLength y := by
  unfold bitLength
  by_cases hx : x = 0
  · simp [hx]
  · have hy : y ≠ 0 := by omega
    rw [if_neg hx, if_neg hy]
    have h2 : y < 2 ^ (y.log2 + 1) := Nat.lt_log2_self
    have h3 : x.log2 < y.log2 + 1 := (Nat.log2_lt hx).2 (by omega)
    omega

/-- EIP-7939: `CLZ(0) = 256`. -/
theorem clz256_zero : clz256 0 = 256 := by decide

/-- `CLZ` never exceeds the word size. -/
theorem clz256_le (x : Nat) : clz256 x ≤ 256 := by
  unfold clz256; omega

/-- Monotonicity: a larger word has no more leading zeros. -/
theorem clz256_antitone {x y : Nat} (h : x ≤ y) : clz256 y ≤ clz256 x := by
  have := bitLength_mono h
  unfold clz256; omega

/-- Only zero has 256 leading zeros. -/
theorem clz256_eq_256_iff (x : Nat) : clz256 x = 256 ↔ x = 0 := by
  unfold clz256 bitLength
  by_cases hx : x = 0
  · simp [hx]
  · simp [hx]; omega

/-- Defining property: `clz256 x` locates the highest set bit of a nonzero word. -/
theorem clz256_spec {x : Nat} (hx : x ≠ 0) (hlt : x < 2 ^ 256) :
    2 ^ (255 - clz256 x) ≤ x ∧ x < 2 ^ (256 - clz256 x) := by
  have hlog : x.log2 < 256 := (Nat.log2_lt hx).2 hlt
  have e1 : 255 - clz256 x = x.log2 := by
    unfold clz256 bitLength; rw [if_neg hx]; omega
  have e2 : 256 - clz256 x = x.log2 + 1 := by
    unfold clz256 bitLength; rw [if_neg hx]; omega
  rw [e1, e2]
  exact ⟨Nat.log2_self_le hx, Nat.lt_log2_self⟩

/-- Fork gate: `CLZ` is defined exactly from Osaka. -/
theorem clzOpcode_isSome_iff (f : Fork) (x : Nat) : (clzOpcode f x).isSome = f.isOsaka := by
  unfold clzOpcode; cases f.isOsaka <;> simp

theorem clzOpcode_le {f : Fork} {x r : Nat} (h : clzOpcode f x = some r) : r ≤ 256 := by
  unfold clzOpcode at h
  split at h
  · cases h; exact clz256_le _
  · cases h

/-! ## EIP-7825: transaction gas limit cap -/

/-- Maximum gas limit of one transaction from Osaka. -/
def txGasLimitCap : Nat := 16777216

theorem txGasLimitCap_eq : txGasLimitCap = 2 ^ 24 := by decide

/-- A transaction's declared gas limit is admissible in fork `f`. -/
def validTxGasLimit (f : Fork) (gasLimit : Nat) : Bool :=
  !f.isOsaka || decide (gasLimit ≤ txGasLimitCap)

/-- From Osaka the cap is exactly `gasLimit ≤ 2^24`. -/
theorem validTxGasLimit_osaka {f : Fork} (h : f.isOsaka = true) (gasLimit : Nat) :
    validTxGasLimit f gasLimit = true ↔ gasLimit ≤ 16777216 := by
  simp [validTxGasLimit, h, txGasLimitCap]

/-- Before Osaka EIP-7825 imposes nothing. -/
theorem validTxGasLimit_pre_osaka {f : Fork} (h : f.isOsaka = false) (gasLimit : Nat) :
    validTxGasLimit f gasLimit = true := by
  simp [validTxGasLimit, h]

/-- Fork-gated statement of EIP-7825 in one equivalence. -/
theorem validTxGasLimit_iff (f : Fork) (gasLimit : Nat) :
    validTxGasLimit f gasLimit = true ↔ (f.isOsaka = true → gasLimit ≤ 2 ^ 24) := by
  cases h : f.isOsaka <;> simp [validTxGasLimit, h, txGasLimitCap]

/-! ## EIP-7934: RLP execution block size cap -/

def maxBlockSize : Nat := 10485760
def blockSizeSafetyMargin : Nat := 2097152

/-- Maximum RLP-encoded execution block size from Osaka. -/
def maxRlpBlockSize : Nat := maxBlockSize - blockSizeSafetyMargin

theorem maxRlpBlockSize_eq : maxRlpBlockSize = 8388608 := by decide
theorem maxRlpBlockSize_eq_pow : maxRlpBlockSize = 2 ^ 23 := by decide

/-- A block whose RLP encoding has `size` bytes is admissible in fork `f`. -/
def validBlockRlpSize (f : Fork) (size : Nat) : Bool :=
  !f.isOsaka || decide (size ≤ maxRlpBlockSize)

theorem validBlockRlpSize_osaka {f : Fork} (h : f.isOsaka = true) (size : Nat) :
    validBlockRlpSize f size = true ↔ size ≤ 8388608 := by
  simp [validBlockRlpSize, h, maxRlpBlockSize, maxBlockSize, blockSizeSafetyMargin]

theorem validBlockRlpSize_pre_osaka {f : Fork} (h : f.isOsaka = false) (size : Nat) :
    validBlockRlpSize f size = true := by
  simp [validBlockRlpSize, h]

theorem validBlockRlpSize_iff (f : Fork) (size : Nat) :
    validBlockRlpSize f size = true ↔ (f.isOsaka = true → size ≤ 8388608) := by
  cases h : f.isOsaka <;>
    simp [validBlockRlpSize, h, maxRlpBlockSize, maxBlockSize, blockSizeSafetyMargin]

/-! ## Blob fee market: EIP-4844, EIP-7691, EIP-7892, EIP-7918 -/

def gasPerBlob : Nat := 131072
def minBaseFeePerBlobGas : Nat := 1
/-- EIP-7918 execution cost of one blob, in units of the base fee. -/
def blobBaseCost : Nat := 8192

theorem fakeExp_step_lt {num den i acc : Nat} (hacc : acc ≠ 0) (hi : num < i) :
    acc * num / (den * i) < acc := by
  by_cases hd : den = 0
  · simp [hd]; omega
  · apply Nat.div_lt_of_lt_mul
    have h1 : i ≤ den * i := Nat.le_mul_of_pos_left i (by omega)
    have h2 : acc * num < acc * (den * i) := (Nat.mul_lt_mul_left (by omega)).2 (by omega)
    rw [Nat.mul_comm (den * i) acc]
    exact h2

/--
Loop of EIP-4844 `fake_exponential`:
`while acc > 0: out += acc; acc = acc * num // (den * i); i += 1`.

Termination is proved, not assumed: while `i ≤ num` the counter `num + 1 - i`
drops, and once `i > num` every step strictly shrinks `acc`.
-/
def fakeExpLoop (num den i out acc : Nat) : Nat :=
  if acc = 0 then out
  else fakeExpLoop num den (i + 1) (out + acc) (acc * num / (den * i))
termination_by (num + 1 - i, acc)
decreasing_by
  by_cases hi : i ≤ num
  · exact Prod.Lex.left _ _ (by omega)
  · have e : num + 1 - (i + 1) = num + 1 - i := by omega
    rw [e]
    exact Prod.Lex.right _ (fakeExp_step_lt (by assumption) (by omega))

/-- EIP-4844 `fake_exponential(factor, numerator, denominator)`. -/
def fakeExponential (factor num den : Nat) : Nat :=
  fakeExpLoop num den 1 0 (factor * den) / den

/-- Blob base fee for `excessBlobGas` under a schedule's update fraction. -/
def blobBaseFee (excessBlobGas updateFraction : Nat) : Nat :=
  fakeExponential minBaseFeePerBlobGas excessBlobGas updateFraction

theorem fakeExpLoop_ge (num den i out acc : Nat) :
    out + acc ≤ fakeExpLoop num den i out acc := by
  fun_induction fakeExpLoop num den i out acc with
  | case1 i out => omega
  | case2 i out acc h ih => exact Nat.le_trans (Nat.le_add_right _ _) ih

/-- Lower bound: the Taylor sum starts at `factor` and only grows. -/
theorem fakeExponential_ge_factor (factor num : Nat) {den : Nat} (hden : 0 < den) :
    factor ≤ fakeExponential factor num den := by
  unfold fakeExponential
  have h := fakeExpLoop_ge num den 1 0 (factor * den)
  exact (Nat.le_div_iff_mul_le hden).2 (by omega)

/-- With no excess the result is exactly `factor` (`e^0 = 1`). -/
theorem fakeExponential_zero_num (factor : Nat) {den : Nat} (hden : 0 < den) :
    fakeExponential factor 0 den = factor := by
  unfold fakeExponential
  by_cases hf : factor * den = 0
  · have hf0 : factor = 0 := by
      rcases Nat.mul_eq_zero.mp hf with h | h
      · exact h
      · omega
    subst hf0
    unfold fakeExpLoop
    simp
  · unfold fakeExpLoop
    rw [if_neg hf]
    unfold fakeExpLoop
    simp
    exact Nat.mul_div_cancel _ hden

/-- The blob base fee never falls below `MIN_BASE_FEE_PER_BLOB_GAS = 1`. -/
theorem blobBaseFee_pos (excess : Nat) {frac : Nat} (h : 0 < frac) : 1 ≤ blobBaseFee excess frac :=
  fakeExponential_ge_factor 1 excess h

/-- With zero excess blob gas the blob base fee is the minimum. -/
theorem blobBaseFee_zero {frac : Nat} (h : 0 < frac) : blobBaseFee 0 frac = 1 :=
  fakeExponential_zero_num 1 h

/-- Blob parameters of one fork or BPO step (EIP-7840 `blobSchedule` entry). -/
structure BlobSchedule where
  target : Nat
  max : Nat
  baseFeeUpdateFraction : Nat
  deriving Repr, DecidableEq

def BlobSchedule.cancun : BlobSchedule := ⟨3, 6, 3338477⟩
def BlobSchedule.prague : BlobSchedule := ⟨6, 9, 5007716⟩
/-- Osaka starts with Prague's parameters; BPO forks then raise them. -/
def BlobSchedule.osaka : BlobSchedule := BlobSchedule.prague
def BlobSchedule.bpo1 : BlobSchedule := ⟨10, 15, 8346193⟩
def BlobSchedule.bpo2 : BlobSchedule := ⟨14, 21, 11684671⟩

/-- A usable schedule: `target ≤ max`, `0 < max`, `0 < baseFeeUpdateFraction`. -/
def BlobSchedule.WellFormed (s : BlobSchedule) : Prop :=
  s.target ≤ s.max ∧ 0 < s.max ∧ 0 < s.baseFeeUpdateFraction

instance (s : BlobSchedule) : Decidable s.WellFormed := by
  unfold BlobSchedule.WellFormed; infer_instance

def cancunTimestamp : Nat := 1710338135
def pragueTimestamp : Nat := 1746612311
def osakaTimestamp : Nat := 1764798551
def bpo1Timestamp : Nat := 1765290071
def bpo2Timestamp : Nat := 1767747671

/-- EIP-7892 mainnet schedule lookup by block timestamp; `none` before Cancun. -/
def blobScheduleAt (timestamp : Nat) : Option BlobSchedule :=
  if bpo2Timestamp ≤ timestamp then some .bpo2
  else if bpo1Timestamp ≤ timestamp then some .bpo1
  else if osakaTimestamp ≤ timestamp then some .osaka
  else if pragueTimestamp ≤ timestamp then some .prague
  else if cancunTimestamp ≤ timestamp then some .cancun
  else none

/-- Mainnet fork (up to Osaka) active at a block timestamp, from Cancun on. -/
def blobForkAt (timestamp : Nat) : Option Fork :=
  if osakaTimestamp ≤ timestamp then some .osaka
  else if pragueTimestamp ≤ timestamp then some .prague
  else if cancunTimestamp ≤ timestamp then some .cancun
  else none

theorem blobSchedule_wellFormed :
    BlobSchedule.cancun.WellFormed ∧ BlobSchedule.prague.WellFormed ∧
    BlobSchedule.osaka.WellFormed ∧ BlobSchedule.bpo1.WellFormed ∧
    BlobSchedule.bpo2.WellFormed := by decide

/-- Activation timestamps are strictly ordered. -/
theorem blobTimestamps_ordered :
    cancunTimestamp < pragueTimestamp ∧ pragueTimestamp < osakaTimestamp ∧
    osakaTimestamp < bpo1Timestamp ∧ bpo1Timestamp < bpo2Timestamp := by decide

/-- A schedule exists exactly from Cancun. -/
theorem blobScheduleAt_isSome_iff (t : Nat) :
    (blobScheduleAt t).isSome = true ↔ cancunTimestamp ≤ t := by
  unfold blobScheduleAt cancunTimestamp pragueTimestamp osakaTimestamp bpo1Timestamp bpo2Timestamp
  repeat' split
  all_goals simp
  all_goals omega

/-- Every schedule the lookup returns is well formed. -/
theorem blobScheduleAt_wellFormed {t : Nat} {s : BlobSchedule} (h : blobScheduleAt t = some s) :
    s.WellFormed := by
  unfold blobScheduleAt at h
  repeat' split at h
  all_goals first
    | (cases h; decide)
    | cases h

/-- Blob-parameter-only forks only raise capacity: `max` is monotone in time. -/
theorem blobScheduleAt_max_mono {t₁ t₂ : Nat} {s₁ s₂ : BlobSchedule} (hle : t₁ ≤ t₂)
    (h₁ : blobScheduleAt t₁ = some s₁) (h₂ : blobScheduleAt t₂ = some s₂) : s₁.max ≤ s₂.max := by
  unfold blobScheduleAt cancunTimestamp pragueTimestamp osakaTimestamp bpo1Timestamp
    bpo2Timestamp at h₁ h₂
  repeat' split at h₁
  all_goals repeat' split at h₂
  all_goals first
    | (cases h₁; cases h₂; decide)
    | (exfalso; omega)
    | cases h₁
    | cases h₂

/-- EIP-4844 `calc_excess_blob_gas` (Cancun and Prague). -/
def calcExcessBlobGasPreOsaka (s : BlobSchedule) (parentExcess parentUsed : Nat) : Nat :=
  parentExcess + parentUsed - gasPerBlob * s.target

/-- EIP-7918 reserve test: one blob's execution-cost floor exceeds its blob fee. -/
def reservePriceActive (s : BlobSchedule) (parentExcess parentBaseFee : Nat) : Bool :=
  decide (gasPerBlob * blobBaseFee parentExcess s.baseFeeUpdateFraction
    < blobBaseCost * parentBaseFee)

/-- EIP-7918 `calc_excess_blob_gas` (Osaka and later). -/
def calcExcessBlobGasOsaka (s : BlobSchedule)
    (parentExcess parentUsed parentBaseFee : Nat) : Nat :=
  if parentExcess + parentUsed < gasPerBlob * s.target then 0
  else if reservePriceActive s parentExcess parentBaseFee then
    parentExcess + parentUsed * (s.max - s.target) / s.max
  else parentExcess + parentUsed - gasPerBlob * s.target

/-- Fork-gated `excess_blob_gas` of a child block; `f` and `s` belong to the child. -/
def calcExcessBlobGas (f : Fork) (s : BlobSchedule)
    (parentExcess parentUsed parentBaseFee : Nat) : Nat :=
  if f.isOsaka then calcExcessBlobGasOsaka s parentExcess parentUsed parentBaseFee
  else calcExcessBlobGasPreOsaka s parentExcess parentUsed

theorem scaled_le (used max target : Nat) : used * (max - target) / max ≤ used := by
  by_cases hm : max = 0
  · simp [hm]
  · apply Nat.div_le_of_le_mul
    rw [Nat.mul_comm max used]
    exact Nat.mul_le_mul_left used (Nat.sub_le max target)

/-- Upper bound: excess never grows by more than the parent's blob gas used. -/
theorem calcExcessBlobGas_le (f : Fork) (s : BlobSchedule) (e u b : Nat) :
    calcExcessBlobGas f s e u b ≤ e + u := by
  have hs := scaled_le u s.max s.target
  unfold calcExcessBlobGas calcExcessBlobGasOsaka calcExcessBlobGasPreOsaka
  repeat' split
  all_goals omega

/-- Below target the excess resets to zero in every fork. -/
theorem calcExcessBlobGas_below_target (f : Fork) (s : BlobSchedule) {e u : Nat} (b : Nat)
    (h : e + u < gasPerBlob * s.target) : calcExcessBlobGas f s e u b = 0 := by
  unfold calcExcessBlobGas calcExcessBlobGasOsaka calcExcessBlobGasPreOsaka
  repeat' split
  all_goals first
    | rfl
    | omega

/-- EIP-7918: while the reserve price binds at or above target, excess does not fall. -/
theorem calcExcessBlobGasOsaka_reserve_ge (s : BlobSchedule) {e u b : Nat}
    (ht : gasPerBlob * s.target ≤ e + u) (hr : reservePriceActive s e b = true) :
    e ≤ calcExcessBlobGasOsaka s e u b := by
  unfold calcExcessBlobGasOsaka
  rw [if_neg (by omega), if_pos hr]
  exact Nat.le_add_right _ _

/-- EIP-7918 never yields less excess than EIP-4844 would for a well-formed schedule. -/
theorem calcExcessBlobGasOsaka_ge_preOsaka {s : BlobSchedule} (hs : s.WellFormed)
    (e u b : Nat) (hu : u ≤ gasPerBlob * s.max) :
    calcExcessBlobGasPreOsaka s e u ≤ calcExcessBlobGasOsaka s e u b := by
  obtain ⟨htm, hm, _⟩ := hs
  unfold calcExcessBlobGasOsaka calcExcessBlobGasPreOsaka
  split
  · omega
  · split
    · -- u - G*target ≤ u*(max-target)/max  ⇐  (u - G*target)*max ≤ u*(max-target)
      have key : (u - gasPerBlob * s.target) * s.max ≤ u * (s.max - s.target) := by
        by_cases hlt : u ≤ gasPerBlob * s.target
        · have : u - gasPerBlob * s.target = 0 := by omega
          rw [this]; simp
        · have h1 : u * s.target ≤ gasPerBlob * s.max * s.target := Nat.mul_le_mul_right _ hu
          have h2 : (u - gasPerBlob * s.target) * s.max
              = u * s.max - gasPerBlob * s.target * s.max := Nat.sub_mul _ _ _
          have h3 : u * (s.max - s.target) = u * s.max - u * s.target := Nat.mul_sub _ _ _
          have h4 : gasPerBlob * s.max * s.target = gasPerBlob * s.target * s.max := by
            rw [Nat.mul_assoc, Nat.mul_comm s.max s.target, ← Nat.mul_assoc]
          omega
      have := (Nat.le_div_iff_mul_le hm).2 key
      omega
    · omega

/-! ## ModExp: EIP-2565 (Berlin), EIP-7823 and EIP-7883 (Osaka) -/

/-- EIP-7823 limit on each declared operand length, in bytes. -/
def modexpMaxOperandBytes : Nat := 1024

/-- EIP-7823: from Osaka each of base, exponent and modulus is at most 1024 bytes. -/
def modexpBoundsOk (f : Fork) (baseLen expLen modLen : Nat) : Bool :=
  !f.isOsaka ||
    (decide (baseLen ≤ modexpMaxOperandBytes) && decide (expLen ≤ modexpMaxOperandBytes)
      && decide (modLen ≤ modexpMaxOperandBytes))

/-- Multiplication complexity for the longer of base and modulus. -/
def modexpMultComplexity (osaka : Bool) (maxLen : Nat) : Nat :=
  let words := (maxLen + 7) / 8
  if osaka then (if maxLen ≤ 32 then 16 else 2 * (words * words)) else words * words

/--
Iteration count. `expHead` is the first `min expLen 32` bytes of the exponent as
a big-endian number; `Nat.log2 expHead` is its bit length minus one (`0` for `0`).
-/
def modexpIterationCount (osaka : Bool) (expLen expHead : Nat) : Nat :=
  let headBits := Nat.log2 expHead
  let adjusted :=
    if expLen ≤ 32 then headBits
    else (if osaka then 16 else 8) * (expLen - 32) + headBits
  max adjusted 1

/-- EIP-2565 gas (Berlin through Prague). -/
def modexpGasBerlin (baseLen expLen modLen expHead : Nat) : Nat :=
  max 200
    (modexpMultComplexity false (max baseLen modLen)
      * modexpIterationCount false expLen expHead / 3)

/-- EIP-7883 gas (Osaka and later). -/
def modexpGasOsaka (baseLen expLen modLen expHead : Nat) : Nat :=
  max 500
    (modexpMultComplexity true (max baseLen modLen)
      * modexpIterationCount true expLen expHead)

/-- Fork-gated ModExp gas. -/
def modexpGas (f : Fork) (baseLen expLen modLen expHead : Nat) : Nat :=
  if f.isOsaka then modexpGasOsaka baseLen expLen modLen expHead
  else modexpGasBerlin baseLen expLen modLen expHead

theorem modexpBoundsOk_osaka {f : Fork} (h : f.isOsaka = true) (b e m : Nat) :
    modexpBoundsOk f b e m = true ↔ b ≤ 1024 ∧ e ≤ 1024 ∧ m ≤ 1024 := by
  simp [modexpBoundsOk, h, modexpMaxOperandBytes, and_assoc]

theorem modexpBoundsOk_pre_osaka {f : Fork} (h : f.isOsaka = false) (b e m : Nat) :
    modexpBoundsOk f b e m = true := by
  simp [modexpBoundsOk, h]

/-- EIP-7883 minimum: ModExp costs at least 500 gas from Osaka. -/
theorem modexpGasOsaka_ge_500 (b e m h : Nat) : 500 ≤ modexpGasOsaka b e m h := by
  unfold modexpGasOsaka; omega

/-- EIP-2565 minimum: ModExp costs at least 200 gas from Berlin. -/
theorem modexpGasBerlin_ge_200 (b e m h : Nat) : 200 ≤ modexpGasBerlin b e m h := by
  unfold modexpGasBerlin; omega

theorem modexpGas_ge_min (f : Fork) (b e m h : Nat) :
    (if f.isOsaka then 500 else 200) ≤ modexpGas f b e m h := by
  unfold modexpGas
  split
  · exact modexpGasOsaka_ge_500 b e m h
  · exact modexpGasBerlin_ge_200 b e m h

theorem modexpMultComplexity_le (maxLen : Nat) :
    modexpMultComplexity false maxLen ≤ modexpMultComplexity true maxLen := by
  simp only [modexpMultComplexity]
  generalize hw : (maxLen + 7) / 8 = w
  by_cases hle : maxLen ≤ 32
  · have hw4 : w ≤ 4 := by omega
    have : w * w ≤ 4 * 4 := Nat.mul_le_mul hw4 hw4
    simp [hle]; omega
  · simp [hle]; omega

theorem modexpIterationCount_le (expLen expHead : Nat) :
    modexpIterationCount false expLen expHead ≤ modexpIterationCount true expLen expHead := by
  simp only [modexpIterationCount]
  split <;> simp <;> omega

/-- EIP-7883 only raises the price: Osaka gas is never below Berlin gas. -/
theorem modexpGasBerlin_le_osaka (b e m h : Nat) :
    modexpGasBerlin b e m h ≤ modexpGasOsaka b e m h := by
  unfold modexpGasBerlin modexpGasOsaka
  have h1 := Nat.mul_le_mul (modexpMultComplexity_le (max b m)) (modexpIterationCount_le e h)
  have h2 := Nat.div_le_self
    (modexpMultComplexity false (max b m) * modexpIterationCount false e h) 3
  omega

/-- Executable square-and-multiply modular exponentiation. -/
def powMod (b e m : Nat) : Nat :=
  if e = 0 then 1 % m
  else
    let half := powMod b (e / 2) m
    let sq := half * half % m
    if e % 2 = 1 then sq * b % m else sq
termination_by e
decreasing_by omega

/-- `powMod` computes the mathematical `b ^ e mod m`. -/
theorem powMod_eq (b e m : Nat) : powMod b e m = b ^ e % m := by
  induction e using Nat.strongRecOn with
  | _ e ih =>
    unfold powMod
    by_cases h0 : e = 0
    · simp [h0]
    · rw [if_neg h0]
      have ihh := ih (e / 2) (by omega)
      have he : 2 * (e / 2) + e % 2 = e := Nat.div_add_mod e 2
      have hp : b ^ e = b ^ (e / 2) * b ^ (e / 2) * b ^ (e % 2) := by
        conv => lhs; rw [← he]
        rw [Nat.pow_add, Nat.two_mul, Nat.pow_add]
      simp only [ihh]
      by_cases h1 : e % 2 = 1
      · rw [if_pos h1, hp, h1, Nat.pow_one]
        rw [← Nat.mul_mod, Nat.mod_mul_mod]
      · have h2 : e % 2 = 0 := by omega
        rw [if_neg h1, hp, h2, Nat.pow_zero, Nat.mul_one, ← Nat.mul_mod]

/-- EIP-198 result value: `base ^ exp mod modulus`, and `0` for a zero modulus. -/
def modexpValue (base exp modulus : Nat) : Nat :=
  if modulus = 0 then 0 else powMod base exp modulus

theorem modexpValue_eq (b e : Nat) {m : Nat} (hm : m ≠ 0) :
    modexpValue b e m = b ^ e % m := by
  unfold modexpValue
  rw [if_neg hm]
  exact powMod_eq b e m

/-- EIP-198: a zero modulus yields zero (Lean's `x % 0 = x` is not used). -/
theorem modexpValue_zero_modulus (b e : Nat) : modexpValue b e 0 = 0 := by
  simp [modexpValue]

theorem modexpValue_lt {m : Nat} (b e : Nat) (hm : 0 < m) : modexpValue b e m < m := by
  rw [modexpValue_eq b e (by omega)]; exact Nat.mod_lt _ hm

/-! ### Byte-level precompile (address 0x05) -/

/-- Big-endian bytes to number. -/
def beNat (bytes : List Nat) : Nat := bytes.foldl (fun acc b => acc * 256 + b) 0

/-- `len` bytes of `input` from `off`, right-padded with zeros past the end. -/
def paddedSlice (input : Array Nat) (off len : Nat) : List Nat :=
  (List.range len).map fun k => input.getD (off + k) 0

/-- `value` as exactly `len` big-endian bytes (truncating high bytes). -/
def toBytesBE (value len : Nat) : List Nat :=
  (List.range len).map fun k => (value >>> (8 * (len - 1 - k))) % 256

theorem paddedSlice_length (input : Array Nat) (off len : Nat) :
    (paddedSlice input off len).length = len := by simp [paddedSlice]

theorem toBytesBE_length (value len : Nat) : (toBytesBE value len).length = len := by
  simp [toBytesBE]

structure ModExpResult where
  /-- Gas charged on success. -/
  gas : Nat
  /-- Returned bytes; always `modLen` of them. -/
  output : List Nat
  deriving Repr

/--
The ModExp precompile on raw calldata bytes. `none` is an exceptional halt
(EIP-7823 bound violated); otherwise the call succeeds iff it is given at
least `gas`. The three 32-byte length words and the operands are read from the
zero-right-padded input (EIP-198).
-/
def modexpPrecompile (f : Fork) (input : Array Nat) : Option ModExpResult :=
  let baseLen := beNat (paddedSlice input 0 32)
  let expLen := beNat (paddedSlice input 32 32)
  let modLen := beNat (paddedSlice input 64 32)
  if !modexpBoundsOk f baseLen expLen modLen then none
  else
    let expHead := beNat (paddedSlice input (96 + baseLen) (min expLen 32))
    let gas := modexpGas f baseLen expLen modLen expHead
    if modLen = 0 then some ⟨gas, []⟩
    else
      let base := beNat (paddedSlice input 96 baseLen)
      let exp := beNat (paddedSlice input (96 + baseLen) expLen)
      let modulus := beNat (paddedSlice input (96 + baseLen + expLen) modLen)
      some ⟨gas, toBytesBE (modexpValue base exp modulus) modLen⟩

/-- From Osaka the precompile halts exactly when a declared length exceeds 1024. -/
theorem modexpPrecompile_isSome (f : Fork) (input : Array Nat) :
    (modexpPrecompile f input).isSome =
      modexpBoundsOk f (beNat (paddedSlice input 0 32)) (beNat (paddedSlice input 32 32))
        (beNat (paddedSlice input 64 32)) := by
  simp only [modexpPrecompile]
  cases modexpBoundsOk f _ _ _ <;> simp
  split <;> simp

/-- A successful call from Osaka costs at least 500 gas. -/
theorem modexpPrecompile_osaka_gas {f : Fork} (hf : f.isOsaka = true) {input : Array Nat}
    {r : ModExpResult} (h : modexpPrecompile f input = some r) : 500 ≤ r.gas := by
  simp only [modexpPrecompile] at h
  split at h
  · cases h
  · split at h
    all_goals
      cases h
      simp only [modexpGas, hf, if_true]
      exact modexpGasOsaka_ge_500 _ _ _ _

end ProtocolSpec
