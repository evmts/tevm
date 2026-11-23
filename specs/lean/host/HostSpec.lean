/-!
# TEVM host-layer reference specification

Executable Lean 4 models of four host-side parsers, each paired with the JavaScript it specifies:

1. `Framing`    : `packages/server/src/internal/extractJsonRpcFrames.js`
2. `Remappings` : `bundler-packages/config/src/json/loadRemappingstxt.js`
3. `ConsoleFmt` : `packages/utils/src/decodeHardhatConsoleLog.js` (`formatArgs`)
4. `Semver`     : `scripts/prepare-changeset-publish.mjs` (semver ranges, #2097 protocol leaks)

All models work on `List Char`. The JavaScript works on UTF-16 code units, and every
character the parsers branch on is ASCII or a BMP whitespace code point, so the two views agree on
well-formed Unicode text. `specs/lean/host/diff-fuzz.test.mjs` checks that agreement against the
live JavaScript.
-/

namespace HostSpec

/-! ## Shared ECMAScript text primitives -/

/-- The ECMAScript `\s` class, which is also the set `String.prototype.trim` strips. -/
def isJsSpace (c : Char) : Bool :=
  let n := c.toNat
  n == 0x09 || n == 0x0A || n == 0x0B || n == 0x0C || n == 0x0D || n == 0x20 || n == 0xA0 ||
    n == 0x1680 || (0x2000 ≤ n && n ≤ 0x200A) || n == 0x2028 || n == 0x2029 || n == 0x202F ||
    n == 0x205F || n == 0x3000 || n == 0xFEFF

/-- `String.prototype.trim`. -/
def jsTrim (l : List Char) : List Char :=
  ((l.dropWhile isJsSpace).reverse.dropWhile isJsSpace).reverse

/-- `Array.prototype.join`. -/
def joinWith (sep : List Char) : List (List Char) → List Char
  | [] => []
  | [x] => x
  | x :: y :: rest => x ++ sep ++ joinWith sep (y :: rest)

/-- `String.prototype.split` on a single character. -/
def splitOn (sep : Char) (l : List Char) : List (List Char) :=
  go [] l
where
  go (cur : List Char) : List Char → List (List Char)
    | [] => [cur.reverse]
    | c :: rest => if c = sep then cur.reverse :: go [] rest else go (c :: cur) rest

/-- Split at the first `sep`: the text before it and, when `sep` occurs, the text after it. -/
def splitFirst (sep : Char) : List Char → List Char × Option (List Char)
  | [] => ([], none)
  | c :: rest =>
    if c = sep then ([], some rest)
    else let r := splitFirst sep rest; (c :: r.1, r.2)

/-! ## 1. JSON-RPC stream framing -/

namespace Framing

/-- A frame cut from the stream: a balanced JSON container, or a newline-terminated line. -/
inductive Frame where
  | container (text : List Char)
  | line (text : List Char)
  deriving Repr, DecidableEq

/-- The frame text delivered to the JSON-RPC handler. -/
def Frame.text : Frame → List Char
  | .container t => t
  | .line t => t

/-- Framer state. `racc` holds the pending characters of the current frame, newest first. -/
inductive State where
  | idle
  | line (racc : List Char)
  | frame (racc : List Char) (depth : Nat) (inString escaped : Bool)
  deriving Repr, DecidableEq

def isOpen (c : Char) : Bool := c == '{' || c == '['
def isClose (c : Char) : Bool := c == '}' || c == ']'

/-- Consume one character. Mirrors one iteration of the loop in `extractJsonRpcFrames`. -/
def step : State → Char → State × Option Frame
  | .idle, c =>
    if isJsSpace c then (.idle, none)
    else if isOpen c then (.frame [c] 1 false false, none)
    else (.line [c], none)
  | .line racc, c =>
    if c == '\n' then (.idle, some (.line (racc.dropWhile isJsSpace).reverse))
    else (.line (c :: racc), none)
  | .frame racc depth inString escaped, c =>
    if inString then
      if escaped then (.frame (c :: racc) depth true false, none)
      else if c == '\\' then (.frame (c :: racc) depth true true, none)
      else if c == '"' then (.frame (c :: racc) depth false escaped, none)
      else (.frame (c :: racc) depth true escaped, none)
    else if c == '"' then (.frame (c :: racc) depth true escaped, none)
    else if isOpen c then (.frame (c :: racc) (depth + 1) false escaped, none)
    else if isClose c then
      if depth ≤ 1 then (.idle, some (.container (c :: racc).reverse))
      else (.frame (c :: racc) (depth - 1) false escaped, none)
    else (.frame (c :: racc) depth false escaped, none)

/-- Run the framer over a chunk: the frames completed inside it and the state afterwards. -/
def run (s : State) : List Char → List Frame × State
  | [] => ([], s)
  | c :: cs =>
    let r := step s c
    let t := run r.1 cs
    (r.2.toList ++ t.1, t.2)

/-- The buffered text a state stands for: the `remaining` half of the JavaScript result. -/
def pending : State → List Char
  | .idle => []
  | .line racc => racc.reverse
  | .frame racc _ _ _ => racc.reverse

/-- `extractJsonRpcFrames(input)`: complete frames and the incomplete remainder. -/
def extract (input : List Char) : List Frame × List Char :=
  let r := run .idle input
  (r.1, pending r.2)

/-- One `socket.on('data')` turn: append the chunk to the buffer, extract, keep the remainder. -/
def feed (acc : List Frame × List Char) (chunk : List Char) : List Frame × List Char :=
  let r := extract (acc.2 ++ chunk)
  (acc.1 ++ r.1, r.2)

/-- Chunk concatenation on the state machine: running `a ++ b` equals running `a` then `b`. -/
theorem run_append (s : State) (a b : List Char) :
    run s (a ++ b) = ((run s a).1 ++ (run (run s a).2 b).1, (run (run s a).2 b).2) := by
  induction a generalizing s with
  | nil => simp [run]
  | cons c cs ih => simp [run, ih, List.append_assoc]

/-- A state is replayable when re-framing its buffered text from idle reproduces it exactly. -/
def Replay (s : State) : Prop := run .idle (pending s) = ([], s)

private theorem replay_push {s s' : State} {c : Char} (h : Replay s)
    (hs : step s c = (s', none)) (hp : pending s' = pending s ++ [c]) : Replay s' := by
  unfold Replay at *
  rw [hp, run_append, h]
  simp [run, hs]

theorem replay_step {s : State} (c : Char) (h : Replay s) : Replay (step s c).1 := by
  cases s with
  | idle =>
    by_cases h1 : isJsSpace c = true
    · simp [step, h1, Replay, pending, run]
    · by_cases h2 : isOpen c = true
      · simp [step, h1, h2, Replay, pending, run]
      · simp [step, h1, h2, Replay, pending, run]
  | line racc =>
    by_cases h1 : (c == '\n') = true
    · simp [step, h1, Replay, pending, run]
    · exact replay_push (c := c) h (by simp [step, h1]) (by simp [step, h1, pending])
  | frame racc depth inString escaped =>
    by_cases hd : isClose c = true ∧ depth ≤ 1 ∧ inString = false ∧ (c == '"') = false ∧
        isOpen c = false
    · obtain ⟨h1, h2, h3, h4, h5⟩ := hd
      simp [step, h1, h2, h3, h4, h5, Replay, pending, run]
    · refine replay_push (c := c) h ?_ ?_ <;>
      · simp only [step]
        repeat' split
        all_goals simp_all [pending]

theorem replay_run {s : State} (l : List Char) (h : Replay s) : Replay (run s l).2 := by
  induction l generalizing s with
  | nil => simpa [run] using h
  | cons c cs ih => simpa [run] using ih (replay_step c h)

/--
Buffer replay. Extracting from `a ++ b` at once equals extracting from `a`, keeping the remainder,
and extracting again once `b` arrives. This is the contract the IPC server relies on.
-/
theorem extract_append (a b : List Char) :
    extract (a ++ b) =
      ((extract a).1 ++ (extract ((extract a).2 ++ b)).1, (extract ((extract a).2 ++ b)).2) := by
  have h : Replay (run .idle a).2 := replay_run a (by simp [Replay, pending, run])
  unfold Replay at h
  simp [extract, run_append, h]

/-- Any chunking of a stream yields the frames and remainder of the unchunked stream. -/
theorem feed_chunks (chunks : List (List Char)) :
    chunks.foldl feed ([], []) = extract chunks.flatten := by
  suffices h : ∀ pre : List Char, chunks.foldl feed (extract pre) = extract (pre ++ chunks.flatten) by
    simpa [extract, run, pending] using h []
  induction chunks with
  | nil => simp
  | cons c cs ih =>
    intro pre
    have hfeed : feed (extract pre) c = extract (pre ++ c) := by
      simp [feed, extract_append pre c]
    simp [List.foldl_cons, hfeed, ih, List.append_assoc]

/-! ### Balanced delimiter tracking -/

/-- Independent delimiter tracker: structural opens and closes outside JSON strings. -/
structure Track where
  inString : Bool
  escaped : Bool
  opens : Nat
  closes : Nat
  deriving Repr, DecidableEq

def track (t : Track) (c : Char) : Track :=
  if t.inString then
    if t.escaped then { t with escaped := false }
    else if c == '\\' then { t with escaped := true }
    else if c == '"' then { t with inString := false }
    else t
  else if c == '"' then { t with inString := true }
  else if isOpen c then { t with opens := t.opens + 1 }
  else if isClose c then { t with closes := t.closes + 1 }
  else t

def scan (l : List Char) : Track := l.foldl track ⟨false, false, 0, 0⟩

/-- Text whose structural delimiters pair up and which does not end inside a string. -/
def Balanced (l : List Char) : Prop := (scan l).opens = (scan l).closes ∧ (scan l).inString = false

theorem scan_snoc (l : List Char) (c : Char) : scan (l ++ [c]) = track (scan l) c := by
  simp [scan, List.foldl_append]

/-- The framer's depth counter agrees with the independent tracker and never reaches zero. -/
def Tracked : State → Prop
  | .frame racc depth inString escaped =>
    (scan racc.reverse).inString = inString ∧ (scan racc.reverse).escaped = escaped ∧
      (scan racc.reverse).opens = (scan racc.reverse).closes + depth ∧ 1 ≤ depth
  | _ => True

theorem tracked_step {s : State} (c : Char) (h : Tracked s) :
    Tracked (step s c).1 ∧ ∀ f, (step s c).2 = some (.container f) → Balanced f := by
  cases s with
  | idle =>
    by_cases h1 : isJsSpace c = true
    · simp [step, h1, Tracked]
    · by_cases h2 : isOpen c = true
      · have h3 : (c == '"') = false := by
          simp only [isOpen, Bool.or_eq_true, beq_iff_eq] at h2
          rcases h2 with h2 | h2 <;> subst h2 <;> decide
        simp [step, h1, h2, h3, Tracked, scan, track]
      · simp [step, h1, h2, Tracked]
  | line racc =>
    by_cases h1 : (c == '\n') = true
    · simp [step, h1, Tracked]
    · simp [step, h1, Tracked]
  | frame racc depth inString escaped =>
    obtain ⟨hs, he, ho, hd⟩ := h
    simp only [step]
    repeat' split
    all_goals simp_all [Tracked, Balanced, scan_snoc, track]
    all_goals omega

theorem tracked_run {s : State} (l : List Char) (h : Tracked s) :
    Tracked (run s l).2 ∧ ∀ f, Frame.container f ∈ (run s l).1 → Balanced f := by
  induction l generalizing s with
  | nil => simpa [run] using h
  | cons c cs ih =>
    obtain ⟨h1, h2⟩ := tracked_step c h
    obtain ⟨h3, h4⟩ := ih h1
    refine ⟨by simpa [run] using h3, ?_⟩
    intro f hf
    simp only [run, List.mem_append, Option.mem_toList] at hf
    rcases hf with hf | hf
    · exact h2 f hf
    · exact h4 f hf

/-- Every container frame the framer emits has balanced structural delimiters. -/
theorem extract_balanced (input : List Char) :
    ∀ f, Frame.container f ∈ (extract input).1 → Balanced f :=
  (tracked_run (s := .idle) input (by simp [Tracked])).2

/-- While a container is open its depth is at least one and equals opens minus closes. -/
theorem open_frame_depth (input racc : List Char) (depth : Nat) (inString escaped : Bool)
    (h : (run .idle input).2 = .frame racc depth inString escaped) :
    1 ≤ depth ∧ (scan racc.reverse).opens = (scan racc.reverse).closes + depth := by
  have ht := (tracked_run (s := .idle) input (by simp [Tracked])).1
  rw [h] at ht
  exact ⟨ht.2.2.2, ht.2.2.1⟩

end Framing

/-! ## 2. `remappings.txt` parser -/

namespace Remappings

abbrev Entry := List Char × List Char

/-- `String.prototype.split(/\r\n|\r|\n/)`. `afterCR` marks that the previous character was CR. -/
def splitLinesGo (cur : List Char) (afterCR : Bool) : List Char → List (List Char)
  | [] => [cur.reverse]
  | c :: rest =>
    if c = '\r' then cur.reverse :: splitLinesGo [] true rest
    else if c = '\n' then
      if afterCR then splitLinesGo cur false rest else cur.reverse :: splitLinesGo [] false rest
    else splitLinesGo (c :: cur) false rest

def splitLines (text : List Char) : List (List Char) := splitLinesGo [] false text

def isSlash (c : Char) : Bool := c == '/' || c == '\\'

/-- The directory prefix joined onto every target, with the separator the config path uses. -/
def baseDir (configPath : List Char) : List Char :=
  let sep := if configPath.contains '\\' && !configPath.contains '/' then '\\' else '/'
  match configPath.getLast? with
  | some c => if isSlash c then configPath else configPath ++ [sep]
  | none => [sep]

def invalidMessage (entry : List Char) : List Char :=
  "Invalid remapping ".toList ++ entry ++
    ". Remapping in remapping.txt should look like @solmate-utils/=lib/solmate/src/utils/".toList

/-- One trimmed entry: split on the first `=`, reject an empty prefix, strip leading slashes. -/
def parseEntry (base entry : List Char) : Except (List Char) Entry :=
  match splitFirst '=' entry with
  | ([], _) => .error (invalidMessage entry)
  | (_, none) => .error (invalidMessage entry)
  | (c :: cs, some target) => .ok (c :: cs, base ++ target.dropWhile isSlash)

def parseEntries (base : List Char) : List (List Char) → Except (List Char) (List Entry)
  | [] => .ok []
  | e :: rest =>
    match parseEntry base e with
    | .error m => .error m
    | .ok p =>
      match parseEntries base rest with
      | .error m => .error m
      | .ok ps => .ok (p :: ps)

/-- `Object.fromEntries` insertion: a repeated key keeps its slot and takes the newest value. -/
def upsert : List Entry → Entry → List Entry
  | [], p => [p]
  | q :: rest, p => if q.1 = p.1 then p :: rest else q :: upsert rest p

/-- Trimmed, non-empty lines of the file. -/
def entryLines (text : List Char) : List (List Char) :=
  ((splitLines text).map jsTrim).filter (fun e => !e.isEmpty)

/-- `loadRemappings`: the prefix-to-target map, or the message of the first invalid entry. -/
def parse (configPath text : List Char) : Except (List Char) (List Entry) :=
  match parseEntries (baseDir configPath) (entryLines text) with
  | .error m => .error m
  | .ok ps => .ok (ps.foldl upsert [])

/-! ### Well-formedness -/

/-- A well-formed entry: non-empty prefix without `=`, target rooted at `base` without a leading slash. -/
def EntryWF (base : List Char) (p : Entry) : Prop :=
  p.1 ≠ [] ∧ '=' ∉ p.1 ∧
    ∃ t, p.2 = base ++ t ∧ t.head? ≠ some '/' ∧ t.head? ≠ some '\\'

theorem splitFirst_not_mem (sep : Char) (l : List Char) : sep ∉ (splitFirst sep l).1 := by
  induction l with
  | nil => simp [splitFirst]
  | cons c cs ih =>
    by_cases h : c = sep
    · simp [splitFirst, h]
    · simp only [splitFirst, h, if_false, List.mem_cons, not_or]
      exact ⟨fun h' => h h'.symm, ih⟩

theorem head_dropWhile_isSlash (l : List Char) :
    (l.dropWhile isSlash).head? ≠ some '/' ∧ (l.dropWhile isSlash).head? ≠ some '\\' := by
  induction l with
  | nil => simp
  | cons c cs ih =>
    by_cases h : isSlash c = true
    · simpa [List.dropWhile, h] using ih
    · have h' : isSlash c = false := by simpa using h
      simp only [List.dropWhile, h', List.head?_cons]
      constructor <;> intro hc <;> injection hc with hc <;> subst hc <;> simp [isSlash] at h'

theorem parseEntry_wf {base entry : List Char} {p : Entry} (h : parseEntry base entry = .ok p) :
    EntryWF base p := by
  unfold parseEntry at h
  have hne := splitFirst_not_mem '=' entry
  split at h
  · cases h
  · cases h
  · rename_i c cs target heq
    cases h
    rw [heq] at hne
    exact ⟨by simp, hne, target.dropWhile isSlash, rfl, head_dropWhile_isSlash target⟩

theorem parseEntries_wf {base : List Char} {lines : List (List Char)} {ps : List Entry}
    (h : parseEntries base lines = .ok ps) : ∀ p ∈ ps, EntryWF base p := by
  induction lines generalizing ps with
  | nil => simp [parseEntries] at h; subst h; simp
  | cons e rest ih =>
    simp only [parseEntries] at h
    split at h
    · cases h
    · rename_i p hp
      split at h
      · cases h
      · rename_i ps' hps
        cases h
        intro q hq
        rcases List.mem_cons.mp hq with hq | hq
        · subst hq; exact parseEntry_wf hp
        · exact ih hps q hq

theorem mem_upsert {m : List Entry} {p q : Entry} (h : q ∈ upsert m p) : q = p ∨ q ∈ m := by
  induction m with
  | nil => simpa [upsert] using h
  | cons r rest ih =>
    by_cases hk : r.1 = p.1
    · simp only [upsert, hk, if_true, List.mem_cons] at h
      rcases h with h | h
      · exact .inl h
      · exact .inr (List.mem_cons_of_mem _ h)
    · simp only [upsert, hk, if_false, List.mem_cons] at h
      rcases h with h | h
      · exact .inr (by simp [h])
      · rcases ih h with h | h
        · exact .inl h
        · exact .inr (List.mem_cons_of_mem _ h)

theorem mem_foldl_upsert {ps m : List Entry} {q : Entry} (h : q ∈ ps.foldl upsert m) :
    q ∈ m ∨ q ∈ ps := by
  induction ps generalizing m with
  | nil => exact .inl (by simpa using h)
  | cons p rest ih =>
    rcases ih (m := upsert m p) (by simpa using h) with h | h
    · rcases mem_upsert h with h | h
      · exact .inr (by simp [h])
      · exact .inl h
    · exact .inr (List.mem_cons_of_mem _ h)

theorem mem_keys_upsert {m : List Entry} {p : Entry} {k : List Char}
    (h : k ∈ (upsert m p).map Prod.fst) : k = p.1 ∨ k ∈ m.map Prod.fst := by
  induction m with
  | nil => simpa [upsert] using h
  | cons r rest ih =>
    by_cases hk : r.1 = p.1
    · simp only [upsert, hk, if_true, List.map_cons, List.mem_cons] at h
      rcases h with h | h
      · exact .inl h
      · exact .inr (by simp [h])
    · simp only [upsert, hk, if_false, List.map_cons, List.mem_cons] at h
      rcases h with h | h
      · exact .inr (by simp [h])
      · rcases ih h with h | h
        · exact .inl h
        · exact .inr (by simp [h])

theorem nodup_upsert {m : List Entry} (p : Entry) (h : (m.map Prod.fst).Nodup) :
    ((upsert m p).map Prod.fst).Nodup := by
  induction m with
  | nil => simp [upsert]
  | cons r rest ih =>
    rw [List.map_cons, List.nodup_cons] at h
    by_cases hk : r.1 = p.1
    · simp only [upsert, hk, if_true, List.map_cons, List.nodup_cons]
      exact ⟨hk ▸ h.1, h.2⟩
    · simp only [upsert, hk, if_false, List.map_cons, List.nodup_cons]
      refine ⟨fun hmem => ?_, ih h.2⟩
      rcases mem_keys_upsert hmem with h' | h'
      · exact hk h'
      · exact h.1 h'

theorem nodup_foldl_upsert {ps m : List Entry} (h : (m.map Prod.fst).Nodup) :
    ((ps.foldl upsert m).map Prod.fst).Nodup := by
  induction ps generalizing m with
  | nil => simpa using h
  | cons p rest ih => simpa using ih (nodup_upsert p h)

/-- Well-formedness: every accepted remapping has a non-empty `=`-free prefix and a based target. -/
theorem parse_wf {configPath text : List Char} {m : List Entry}
    (h : parse configPath text = .ok m) : ∀ p ∈ m, EntryWF (baseDir configPath) p := by
  unfold parse at h
  split at h
  · cases h
  · rename_i ps hps
    cases h
    intro p hp
    rcases mem_foldl_upsert hp with hp | hp
    · simp at hp
    · exact parseEntries_wf hps p hp

/-- Determinism of lookup: the accepted map binds each prefix to exactly one target. -/
theorem parse_functional {configPath text : List Char} {m : List Entry}
    (h : parse configPath text = .ok m) : (m.map Prod.fst).Nodup := by
  unfold parse at h
  split at h
  · cases h
  · cases h; exact nodup_foldl_upsert (by simp)

/-! ### Line-ending independence -/

/-- Rewrite every LF as CRLF. -/
def toCRLF : List Char → List Char
  | [] => []
  | c :: rest => if c = '\n' then '\r' :: '\n' :: toCRLF rest else c :: toCRLF rest

/-- Rewrite every LF as a lone CR. -/
def toCR : List Char → List Char
  | [] => []
  | c :: rest => if c = '\n' then '\r' :: toCR rest else c :: toCR rest

theorem splitLinesGo_toCRLF (l cur : List Char) (h : '\r' ∉ l) :
    splitLinesGo cur false (toCRLF l) = splitLinesGo cur false l := by
  induction l generalizing cur with
  | nil => rfl
  | cons c rest ih =>
    have hc : c ≠ '\r' := fun e => h (by simp [e])
    have hr : '\r' ∉ rest := fun e => h (List.mem_cons_of_mem _ e)
    by_cases hn : c = '\n'
    · subst hn
      simp [toCRLF, splitLinesGo, ih _ hr]
    · simp [toCRLF, splitLinesGo, hc, hn, ih _ hr]

theorem splitLinesGo_flag (l cur : List Char) (b : Bool) (h : '\n' ∉ l) :
    splitLinesGo cur b l = splitLinesGo cur false l := by
  cases l with
  | nil => rfl
  | cons c rest =>
    have hc : c ≠ '\n' := fun e => h (by simp [e])
    simp [splitLinesGo, hc]

theorem toCR_no_lf (l : List Char) : '\n' ∉ toCR l := by
  induction l with
  | nil => simp [toCR]
  | cons c rest ih =>
    by_cases hn : c = '\n'
    · simp [toCR, hn, ih]
    · simp only [toCR, hn, if_false, List.mem_cons, not_or]
      exact ⟨fun e => hn e.symm, ih⟩

theorem splitLinesGo_toCR (l cur : List Char) (h : '\r' ∉ l) :
    splitLinesGo cur false (toCR l) = splitLinesGo cur false l := by
  induction l generalizing cur with
  | nil => rfl
  | cons c rest ih =>
    have hc : c ≠ '\r' := fun e => h (by simp [e])
    have hr : '\r' ∉ rest := fun e => h (List.mem_cons_of_mem _ e)
    by_cases hn : c = '\n'
    · subst hn
      simp [toCR, splitLinesGo, splitLinesGo_flag _ _ true (toCR_no_lf rest), ih _ hr]
    · simp [toCR, splitLinesGo, hc, hn, ih _ hr]

/-- Determinism across platforms: an LF file parses identically when saved with CRLF endings. -/
theorem parse_crlf (configPath text : List Char) (h : '\r' ∉ text) :
    parse configPath (toCRLF text) = parse configPath text := by
  simp [parse, entryLines, splitLines, splitLinesGo_toCRLF text [] h]

/-- Determinism across platforms: an LF file parses identically when saved with lone CR endings. -/
theorem parse_cr (configPath text : List Char) (h : '\r' ∉ text) :
    parse configPath (toCR text) = parse configPath text := by
  simp [parse, entryLines, splitLines, splitLinesGo_toCR text [] h]

end Remappings

/-! ## 3. Hardhat `console.log` format strings -/

namespace ConsoleFmt

/--
A decoded console argument as JavaScript sees it. `address` and `bytes` values are JavaScript
strings, so they are `str`; `uint256` and `int256` are `int`.
-/
inductive Val where
  | str (s : List Char)
  | int (i : Int)
  | bool (b : Bool)
  deriving Repr, DecidableEq

/-- `formatValue`. -/
def Val.render : Val → List Char
  | .str s => s
  | .int i => (toString i).toList
  | .bool true => "true".toList
  | .bool false => "false".toList

/-- The replacement for one consumed specifier. -/
def substitute (spec : Char) (v : Val) : List Char :=
  if spec = 's' then v.render
  else if spec = 'o' then
    match v with
    | .str s => '\'' :: s ++ ['\'']
    | _ => v.render
  else
    match v with
    | .int i => (toString i).toList
    | _ => "NaN".toList

def isSpec (c : Char) : Bool := c == 's' || c == 'd' || c == 'i' || c == 'o'

/-- `first.replace(/%([sdio%])/g, ...)`: the expanded head and the arguments left unconsumed. -/
def expand : List Char → List Val → List Char × List Val
  | [], args => ([], args)
  | [c], args => ([c], args)
  | c :: d :: rest, args =>
    if c = '%' then
      if d = '%' then
        let r := expand rest args
        ('%' :: r.1, r.2)
      else if isSpec d then
        match args with
        | [] =>
          let r := expand rest []
          ('%' :: d :: r.1, r.2)
        | v :: vs =>
          let r := expand rest vs
          (substitute d v ++ r.1, r.2)
      else
        let r := expand rest args
        ('%' :: d :: r.1, r.2)
    else
      let r := expand (d :: rest) args
      (c :: r.1, r.2)

/-- `formatArgs`: a leading string is a format string; leftover arguments are appended. -/
def format : List Val → List Char
  | .str f :: rest =>
    let r := expand f rest
    joinWith [' '] (r.1 :: r.2.map Val.render)
  | args => joinWith [' '] (args.map Val.render)

/-- A format string without `%` is printed verbatim and consumes no argument. -/
theorem expand_plain (f : List Char) (args : List Val) (h : '%' ∉ f) : expand f args = (f, args) := by
  fun_induction expand f args <;> simp_all (config := { zetaDelta := true })

end ConsoleFmt

/-! ## 4. Semver ranges and dependency-protocol leaks (#2097) -/

namespace Semver

structure Version where
  major : Nat
  minor : Nat
  patch : Nat
  prerelease : Option (List Char)
  deriving Repr, DecidableEq

def isDigit (c : Char) : Bool := '0' ≤ c && c ≤ '9'

def isIdChar (c : Char) : Bool :=
  isDigit c || ('A' ≤ c && c ≤ 'Z') || ('a' ≤ c && c ≤ 'z') || c == '-'

def digitsToNat (l : List Char) : Nat := l.foldl (fun n c => n * 10 + (c.toNat - '0'.toNat)) 0

/-- `0|[1-9]\d*` that is also a JavaScript safe integer. -/
def parseNumber (l : List Char) : Option Nat :=
  match l with
  | [] => none
  | c :: rest =>
    if !(c :: rest).all isDigit then none
    else if c = '0' && !rest.isEmpty then none
    else
      let n := digitsToNat (c :: rest)
      if n ≤ 9007199254740991 then some n else none

/-- `[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*`. -/
def validIdentifiers (l : List Char) : Bool :=
  (splitOn '.' l).all (fun id => !id.isEmpty && id.all isIdChar)

/-- `/^0\d+$/`: a numeric identifier with a leading zero. -/
def hasLeadingZero (id : List Char) : Bool :=
  match id with
  | c :: d :: rest => c == '0' && (d :: rest).all isDigit
  | _ => false

/-- `parseSemver`: strict SemVer 2.0.0; build metadata is validated and discarded. -/
def parse (v : List Char) : Option Version :=
  let (main, build) := splitFirst '+' v
  let (core, pre) := splitFirst '-' main
  let buildOk := match build with
    | none => true
    | some b => validIdentifiers b
  let preOk := match pre with
    | none => true
    | some p => validIdentifiers p && !(splitOn '.' p).any hasLeadingZero
  if !(buildOk && preOk) then none
  else
    match splitOn '.' core with
    | [a, b, c] =>
      match parseNumber a, parseNumber b, parseNumber c with
      | some major, some minor, some patch => some ⟨major, minor, patch, pre⟩
      | _, _, _ => none
    | _ => none

/-- JavaScript `x < y` on ASCII identifiers. -/
def strLt : List Char → List Char → Bool
  | [], [] => false
  | [], _ :: _ => true
  | _ :: _, [] => false
  | a :: as, b :: bs => if a.toNat < b.toNat then true else if b.toNat < a.toNat then false else strLt as bs

/-- Precedence of two unequal-or-equal identifiers: negative, zero or positive. -/
def compareIdentifier (x y : List Char) : Int :=
  if x = y then 0
  else
    let nx := !x.isEmpty && x.all isDigit
    let ny := !y.isEmpty && y.all isDigit
    if nx != ny then (if nx then -1 else 1)
    else if nx && x.length != y.length then (x.length : Int) - (y.length : Int)
    else if strLt x y then -1 else 1

def compareIdentifiers : List (List Char) → List (List Char) → Int
  | [], [] => 0
  | [], _ :: _ => -1
  | _ :: _, [] => 1
  | x :: xs, y :: ys =>
    let c := compareIdentifier x y
    if c = 0 then compareIdentifiers xs ys else c

/-- `comparePrerelease`: a release outranks every prerelease of the same core version. -/
def comparePrerelease : Option (List Char) → Option (List Char) → Int
  | none, none => 0
  | none, some _ => 1
  | some _, none => -1
  | some a, some b => if a = b then 0 else compareIdentifiers (splitOn '.' a) (splitOn '.' b)

/-- `satisfiesRange` for exact, caret and tilde ranges. -/
def satisfies (version range : List Char) : Bool :=
  let (op, body) : Option Char × List Char :=
    match range with
    | c :: rest => if c = '~' || c = '^' then (some c, rest) else (none, range)
    | [] => (none, [])
  match parse version, parse body with
  | some v, some r =>
    if v.major != r.major then false
    else if v.minor == r.minor && v.patch == r.patch then
      if v.prerelease.isSome && r.prerelease.isNone then false
      else
        let cmp := comparePrerelease v.prerelease r.prerelease
        if op.isSome then decide (cmp ≥ 0) else decide (cmp = 0)
    else if op.isNone || v.prerelease.isSome || v.minor < r.minor ||
        (v.minor == r.minor && v.patch < r.patch) then false
    else if op == some '~' then v.minor == r.minor
    else r.major > 0 || (r.minor > 0 && v.minor == r.minor)
  | _, _ => false

/-- `resolveWorkspaceRange`. -/
def resolveWorkspaceRange (spec target : List Char) : List Char :=
  if spec = "workspace:*".toList || spec = "workspace:^".toList then '^' :: target
  else if spec = "workspace:~".toList then '~' :: target
  else
    let explicit := spec.drop "workspace:".length
    if explicit.isEmpty then '^' :: target else explicit

/-- A runtime dependency specifier that must never reach the registry (#2097). -/
def unpublishable (spec : List Char) : Bool :=
  let t := jsTrim spec
  "file:".toList.isPrefixOf t || "link:".toList.isPrefixOf t || "portal:".toList.isPrefixOf t ||
    ".tgz".toList.isSuffixOf t || (spec != t && "workspace:".toList.isPrefixOf t)

/-- A specifier pnpm rewrites at publish time, so its target must be a public workspace member. -/
def isWorkspaceSpec (spec : List Char) : Bool := "workspace:".toList.isPrefixOf spec

/-- Exact, caret and tilde ranges never cross a major version. -/
theorem satisfies_major {version range : List Char} (h : satisfies version range = true) :
    ∃ v r op, parse version = some v ∧ parse (range.drop op) = some r ∧ v.major = r.major := by
  unfold satisfies at h
  split at h
  rename_i op body hsplit
  split at h
  · rename_i v r hv hr
    by_cases hm : v.major = r.major
    · cases range with
      | nil =>
        simp at hsplit
        exact ⟨v, r, 0, hv, by simpa [← hsplit.2] using hr, hm⟩
      | cons c rest =>
        by_cases hc : c = '~' ∨ c = '^'
        · simp [hc] at hsplit
          exact ⟨v, r, 1, hv, by simpa [← hsplit.2] using hr, hm⟩
        · simp [hc] at hsplit
          exact ⟨v, r, 0, hv, by simpa [← hsplit.2] using hr, hm⟩
    · simp [hm] at h
  · cases h

/-- Precedence is reflexive: a prerelease tag ties with itself. -/
theorem comparePrerelease_self (p : Option (List Char)) : comparePrerelease p p = 0 := by
  cases p <;> simp [comparePrerelease]

/-- `workspace:*` publishes as a caret range on the target version. -/
theorem workspace_star_caret (target : List Char) :
    resolveWorkspaceRange "workspace:*".toList target = '^' :: target := by
  simp [resolveWorkspaceRange]

end Semver

end HostSpec
