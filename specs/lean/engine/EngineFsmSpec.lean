/-!
# TEVM engine lifecycle and EVM snapshot/revert state machine

Executable reference specification for `createZevmEngine` (`packages/node`) and the
ZEVM dev-node state it fronts. Pure Lean 4 core: no Mathlib, no network dependencies.

* Part 1 models the EVM dev-node state: accounts (balance, nonce, code, storage), the
  block number, and the `evm_snapshot` / `evm_revert` store.
* Part 2 models the `ZevmEngine` lifecycle: open/closed, the monotonic JSON-RPC id
  counter of the serialized request queue, close idempotency, post-close rejection, and
  the `consoleLog` latch that clears when the backend answers `tevm_drainConsoleLogs`
  with `-32601`.

`Main.lean` runs these definitions as a batch oracle. `diff-fuzz.test.mjs` compares the
oracle with the live engine at every step. Every theorem below is fully proved; no proof is omitted or admitted.
-/

namespace EngineFsm

/-! ## Part 1: EVM dev-node state machine -/

/-- Exclusive upper bound of a 256-bit word. -/
def U256 : Nat := 2 ^ 256

/-- Exclusive upper bound of a 64-bit quantity. -/
def U64 : Nat := 2 ^ 64

/-- One account. `code` is lowercase hex without the `0x` prefix. `storage` is an
association list whose first binding for a slot wins; an absent slot reads zero. -/
structure Account where
  balance : Nat := 0
  nonce : Nat := 0
  code : String := ""
  storage : List (Nat × Nat) := []
  deriving DecidableEq, Repr

/-- Read one storage slot. -/
def Account.slot (acc : Account) (k : Nat) : Nat := (acc.storage.lookup k).getD 0

/-- Account, storage and block state. `accounts` is an association list whose first
binding for an address wins; an absent address is the empty account. -/
structure World where
  accounts : List (Nat × Account) := []
  blockNumber : Nat := 0
  deriving DecidableEq, Repr

/-- Read one account. -/
def World.get (w : World) (a : Nat) : Account := (w.accounts.lookup a).getD {}

/-- Replace one account. -/
def World.set (w : World) (a : Nat) (acc : Account) : World :=
  { w with accounts := (a, acc) :: w.accounts }

/-- A saved world, keyed by the id `evm_snapshot` returned. -/
structure Snapshot where
  id : Nat
  world : World
  deriving DecidableEq, Repr

/-- The dev node: the live world, the saved snapshots and the id counter. Ids start at
one and are never reused, including after a revert. -/
structure Node where
  world : World := {}
  snapshots : List Snapshot := []
  nextSnapshotId : Nat := 1
  deriving DecidableEq, Repr

/-- JSON-RPC commands in the model. Addresses are assumed to be below `2 ^ 160`. -/
inductive Cmd where
  /-- `anvil_setBalance [a, v]` -/
  | setBalance (a v : Nat)
  /-- `anvil_setNonce [a, v]` -/
  | setNonce (a v : Nat)
  /-- `anvil_setCode [a, code]` -/
  | setCode (a : Nat) (code : String)
  /-- `anvil_setStorageAt [a, slot, v]` -/
  | setStorageAt (a slot v : Nat)
  /-- `evm_mine [count]`: mines `count` empty blocks. -/
  | mine (count : Nat)
  /-- `evm_snapshot []` -/
  | snapshot
  /-- `evm_revert [id]` -/
  | revert (id : Nat)
  /-- `eth_getBalance [a, "latest"]` -/
  | getBalance (a : Nat)
  /-- `eth_getTransactionCount [a, "latest"]` -/
  | getTransactionCount (a : Nat)
  /-- `eth_getCode [a, "latest"]` -/
  | getCode (a : Nat)
  /-- `eth_getStorageAt [a, slot, "latest"]` -/
  | getStorageAt (a slot : Nat)
  /-- `eth_blockNumber []` -/
  | blockNumber
  /-- `eth_call [{to: a}, "latest"]`. Modeled only for accounts without code. -/
  | call (a : Nat)
  /-- `eth_call []`: malformed parameters. -/
  | callInvalid
  /-- A method the backend does not implement. -/
  | unknown
  deriving DecidableEq, Repr

/-- JSON-RPC results and errors. -/
inductive Resp where
  | bool (b : Bool)
  /-- A minimal hex quantity. -/
  | quantity (n : Nat)
  /-- A 32-byte zero-padded hex word. -/
  | word (n : Nat)
  /-- Hex data, without the `0x` prefix. -/
  | data (hex : String)
  /-- A JSON-RPC error code. -/
  | error (code : Int)
  /-- The model does not define this response. The fuzzer never generates such a step. -/
  | unmodeled
  deriving DecidableEq, Repr

/-- JSON-RPC `Invalid params`. -/
def invalidParams : Resp := .error (-32602)

/-- JSON-RPC `Method not found`. -/
def methodNotFound : Resp := .error (-32601)

/-- One backend JSON-RPC call: the new node and the response. A rejected command leaves
the node unchanged. -/
def Node.step (n : Node) : Cmd → Node × Resp
  | .setBalance a v =>
    if v < U256 then
      ({ n with world := n.world.set a { n.world.get a with balance := v } }, .bool true)
    else (n, invalidParams)
  | .setNonce a v =>
    if v < U64 then
      ({ n with world := n.world.set a { n.world.get a with nonce := v } }, .bool true)
    else (n, invalidParams)
  | .setCode a c =>
    ({ n with world := n.world.set a { n.world.get a with code := c } }, .bool true)
  | .setStorageAt a k v =>
    if k < U256 ∧ v < U256 then
      ({ n with
          world := n.world.set a
            { n.world.get a with storage := (k, v) :: (n.world.get a).storage } },
        .bool true)
    else (n, invalidParams)
  | .mine c =>
    if c < U64 then
      ({ n with world := { n.world with blockNumber := n.world.blockNumber + c } }, .bool true)
    else (n, invalidParams)
  | .snapshot =>
    ({ n with
        snapshots := ⟨n.nextSnapshotId, n.world⟩ :: n.snapshots
        nextSnapshotId := n.nextSnapshotId + 1 },
      .quantity n.nextSnapshotId)
  | .revert id =>
    if id < U64 then
      match n.snapshots.find? (·.id == id) with
      | some s =>
        ({ n with world := s.world, snapshots := n.snapshots.filter (·.id < id) }, .bool true)
      | none => (n, .bool false)
    else (n, invalidParams)
  | .getBalance a => (n, .quantity (n.world.get a).balance)
  | .getTransactionCount a => (n, .quantity (n.world.get a).nonce)
  | .getCode a => (n, .data (n.world.get a).code)
  | .getStorageAt a k =>
    if k < U256 then (n, .word ((n.world.get a).slot k)) else (n, invalidParams)
  | .blockNumber => (n, .quantity n.world.blockNumber)
  | .call a => (n, if (n.world.get a).code = "" then .data "" else .unmodeled)
  | .callInvalid => (n, invalidParams)
  | .unknown => (n, methodNotFound)

/-- Run commands in order and keep the final node. -/
def Node.run (n : Node) (cs : List Cmd) : Node := cs.foldl (fun n c => (n.step c).1) n

/-- Every saved snapshot id is below the id counter. -/
def Node.WF (n : Node) : Prop := ∀ s ∈ n.snapshots, s.id < n.nextSnapshotId

/-- Commands that never change the node. -/
def Cmd.isRead : Cmd → Bool
  | .getBalance _ | .getTransactionCount _ | .getCode _ | .getStorageAt _ _
  | .blockNumber | .call _ | .callInvalid | .unknown => true
  | _ => false

/-- A command that leaves snapshot `id` in place: any command except a revert to `id`
or to an older snapshot. -/
def Cmd.Above (id : Nat) : Cmd → Prop
  | .revert j => id < j
  | _ => True

/-! ### Lemmas about the snapshot store -/

theorem filter_lt_self {l : List Snapshot} {b : Nat} (h : ∀ s ∈ l, s.id < b) :
    l.filter (·.id < b) = l := by
  apply List.filter_eq_self.mpr
  intro s hs
  simpa using h s hs

theorem filter_lt_filter_lt {l : List Snapshot} {id j : Nat} (hlt : id < j) :
    (l.filter (·.id < j)).filter (·.id < id) = l.filter (·.id < id) := by
  induction l with
  | nil => rfl
  | cons x xs ih =>
    by_cases h1 : x.id < id
    · have h2 : x.id < j := Nat.lt_trans h1 hlt
      simp [h1, h2, ih]
    · by_cases h2 : x.id < j
      · simp [h1, h2, ih]
      · simp [h1, h2, ih]

theorem find_filter_lt {l : List Snapshot} {id j : Nat} {s : Snapshot} (hlt : id < j)
    (h : l.find? (·.id == id) = some s) :
    (l.filter (·.id < j)).find? (·.id == id) = some s := by
  induction l with
  | nil => simp at h
  | cons x xs ih =>
    by_cases hx : x.id = id
    · subst hx
      simp at h
      subst h
      simp [hlt]
    · simp [hx] at h
      by_cases hj : x.id < j
      · simp [hj, hx, ih h]
      · simp [hj, ih h]

/-! ### Safety theorems for the EVM state machine -/

/-- `Node.WF` holds initially. -/
theorem Node.wf_init : (({} : Node)).WF := by
  intro s hs
  cases hs

/-- `Node.WF` is an invariant of every command. -/
theorem Node.wf_step {n : Node} (h : n.WF) (c : Cmd) : (n.step c).1.WF := by
  cases c with
  | snapshot =>
    intro s hs
    simp only [Node.step, List.mem_cons] at hs
    rcases hs with hs | hs
    · subst hs
      exact Nat.lt_succ_self _
    · exact Nat.lt_succ_of_lt (h s hs)
  | revert id =>
    simp only [Node.step]
    split
    · split
      · intro s hs
        exact h s (List.mem_filter.mp hs).1
      · exact h
    · exact h
  | _ => simp only [Node.step] <;> (try split) <;> exact h

/-- Read commands never change the node. -/
theorem Node.read_preserves (n : Node) (c : Cmd) (h : c.isRead = true) : (n.step c).1 = n := by
  cases c <;> simp [Cmd.isRead] at h <;> simp only [Node.step] <;> (try split) <;> rfl

/-- **Snapshot then revert.** Reverting to the id that `evm_snapshot` just returned
answers `true` and restores the exact account, storage and block state. Only the
snapshot id counter advances. -/
theorem Node.revert_snapshot (n : Node) (h64 : n.nextSnapshotId < U64) :
    (n.step .snapshot).2 = .quantity n.nextSnapshotId ∧
    (n.step .snapshot).1.step (.revert n.nextSnapshotId) =
      ({ world := n.world
         snapshots := n.snapshots.filter (·.id < n.nextSnapshotId)
         nextSnapshotId := n.nextSnapshotId + 1 }, .bool true) := by
  simp [Node.step, h64]

/-- Snapshot then revert on a well-formed node is the identity up to the id counter. -/
theorem Node.revert_snapshot_exact (n : Node) (hwf : n.WF) (h64 : n.nextSnapshotId < U64) :
    (n.step .snapshot).1.step (.revert n.nextSnapshotId) =
      ({ n with nextSnapshotId := n.nextSnapshotId + 1 }, .bool true) := by
  rw [(Node.revert_snapshot n h64).2, filter_lt_self hwf]

/-- Snapshot `id` is live, holds world `w`, and `base` is the store below it. -/
def Node.Holds (n : Node) (id : Nat) (w : World) (base : List Snapshot) : Prop :=
  id < n.nextSnapshotId ∧
  n.snapshots.find? (·.id == id) = some ⟨id, w⟩ ∧
  n.snapshots.filter (·.id < id) = base

theorem Node.holds_step {n : Node} {id : Nat} {w : World} {base : List Snapshot}
    (h : n.Holds id w base) {c : Cmd} (hc : c.Above id) : (n.step c).1.Holds id w base := by
  obtain ⟨hlt, hfind, hbase⟩ := h
  cases c with
  | snapshot =>
    have hne : ¬ n.nextSnapshotId = id := Nat.ne_of_gt hlt
    have hnlt : ¬ n.nextSnapshotId < id := Nat.not_lt.mpr (Nat.le_of_lt hlt)
    refine ⟨Nat.lt_succ_of_lt hlt, ?_, ?_⟩
    · simp [Node.step, hne, hfind]
    · simp [Node.step, hnlt, hbase]
  | revert j =>
    have hj : id < j := hc
    simp only [Node.step]
    split
    · split
      · exact ⟨hlt, find_filter_lt hj hfind, by rw [filter_lt_filter_lt hj]; exact hbase⟩
      · exact ⟨hlt, hfind, hbase⟩
    · exact ⟨hlt, hfind, hbase⟩
  | _ => simp only [Node.step] <;> (try split) <;> exact ⟨hlt, hfind, hbase⟩

theorem Node.holds_run {id : Nat} {w : World} {base : List Snapshot} (cs : List Cmd) :
    ∀ {n : Node}, n.Holds id w base → (∀ c ∈ cs, c.Above id) → (n.run cs).Holds id w base := by
  induction cs with
  | nil => intro n h _; exact h
  | cons c cs ih =>
    intro n h hcs
    exact ih (Node.holds_step h (hcs c (List.mem_cons_self ..)))
      (fun c' hc' => hcs c' (List.mem_cons_of_mem _ hc'))

/-- **Nested snapshot/revert.** Take a snapshot, then run any commands: state edits,
mining, further snapshots, and reverts to those later snapshots. Reverting to the first
snapshot then answers `true` and restores the exact account, storage and block state.
On a well-formed node it also restores the exact snapshot store. -/
theorem Node.revert_restores_after_trace (n : Node) (cs : List Cmd)
    (h64 : n.nextSnapshotId < U64) (hcs : ∀ c ∈ cs, c.Above n.nextSnapshotId) :
    let after := ((n.step .snapshot).1.run cs).step (.revert n.nextSnapshotId)
    after.2 = .bool true ∧
    after.1.world = n.world ∧
    after.1.snapshots = n.snapshots.filter (·.id < n.nextSnapshotId) ∧
    (n.WF → after.1.snapshots = n.snapshots) := by
  have h0 : (n.step .snapshot).1.Holds n.nextSnapshotId n.world
      (n.snapshots.filter (·.id < n.nextSnapshotId)) := by
    refine ⟨Nat.lt_succ_self _, ?_, ?_⟩
    · simp [Node.step]
    · simp [Node.step]
  obtain ⟨_, hfind, hbase⟩ := Node.holds_run cs h0 hcs
  intro after
  have hstep : after =
      ({ ((n.step .snapshot).1.run cs) with
          world := n.world
          snapshots := n.snapshots.filter (·.id < n.nextSnapshotId) }, .bool true) := by
    show ((n.step .snapshot).1.run cs).step (.revert n.nextSnapshotId) = _
    generalize (n.step .snapshot).1.run cs = n2 at hfind hbase ⊢
    simp only [Node.step, h64, if_true, hfind, hbase]
  refine ⟨by rw [hstep], by rw [hstep], by rw [hstep], ?_⟩
  intro hwf
  rw [hstep]
  exact filter_lt_self hwf

/-- A revert consumes its snapshot: reverting twice to the same id answers `false` and
changes nothing the second time. -/
theorem Node.revert_twice (n : Node) (id : Nat) (hwf : n.WF) :
    ((n.step (.revert id)).1.step (.revert id)).1 = (n.step (.revert id)).1 ∧
    ((n.step (.revert id)).2 = .bool true →
      ((n.step (.revert id)).1.step (.revert id)).2 = .bool false) := by
  have _ := hwf
  simp only [Node.step]
  by_cases h64 : id < U64
  · cases hfind : n.snapshots.find? (·.id == id) with
    | none => simp [h64, hfind]
    | some s =>
      have hnone : (n.snapshots.filter (·.id < id)).find? (·.id == id) = none := by
        apply List.find?_eq_none.mpr
        intro x hx
        have hlt : x.id < id := by simpa using (List.mem_filter.mp hx).2
        simpa using Nat.ne_of_lt hlt
      simp [h64, hnone]
  · simp [h64, invalidParams]

/-- Reverting to an id that was never issued answers `false` and changes nothing. -/
theorem Node.revert_unknown (n : Node) (id : Nat) (hwf : n.WF) (hid : n.nextSnapshotId ≤ id)
    (h64 : id < U64) : n.step (.revert id) = (n, .bool false) := by
  have hnone : n.snapshots.find? (·.id == id) = none := by
    apply List.find?_eq_none.mpr
    intro x hx
    have hlt : x.id < id := Nat.lt_of_lt_of_le (hwf x hx) hid
    simpa using Nat.ne_of_lt hlt
  simp [Node.step, h64, hnone]

/-- A balance write is read back, and leaves other accounts untouched. -/
theorem Node.setBalance_get (n : Node) (a b v : Nat) (hv : v < U256) :
    ((n.step (.setBalance a v)).1.step (.getBalance b)).2 =
      .quantity (if b = a then v else (n.world.get b).balance) := by
  by_cases hab : b = a
  · simp [Node.step, hv, World.get, World.set, hab]
  · have hbeq : (b == a) = false := by simpa using hab
    simp [Node.step, hv, World.get, World.set, List.lookup, hab, hbeq]

/-- A storage write is read back, and leaves other slots untouched. -/
theorem Node.setStorageAt_get (n : Node) (a k k' v : Nat) (hk : k < U256) (hk' : k' < U256)
    (hv : v < U256) :
    ((n.step (.setStorageAt a k v)).1.step (.getStorageAt a k')).2 =
      .word (if k' = k then v else (n.world.get a).slot k') := by
  by_cases hkk : k' = k
  · simp [Node.step, hk, hv, World.get, World.set, Account.slot, hkk]
  · have hbeq : (k' == k) = false := by simpa using hkk
    simp [Node.step, hk, hk', hv, World.get, World.set, List.lookup, Account.slot, hkk, hbeq]

/-! ## Part 2: `ZevmEngine` lifecycle -/

/-- Engine construction options that the model observes. -/
structure Config where
  /-- The `consoleLog` option is set, so the engine drains console logs. -/
  consoleLog : Bool
  /-- The backend implements `tevm_drainConsoleLogs`. Otherwise it answers `-32601`. -/
  backendDrains : Bool
  deriving DecidableEq, Repr

/-- Engine state. -/
structure Engine where
  /-- `close()` has run. -/
  closed : Bool := false
  /-- The last JSON-RPC id the engine sent to its backend. -/
  lastId : Nat := 0
  /-- `consoleLogSupported`: the engine still drains console logs. -/
  drainLatch : Bool
  /-- How many times the engine called `backend.close()`. -/
  backendCloses : Nat := 0
  /-- The backend's state. -/
  node : Node := {}
  deriving DecidableEq, Repr

/-- A new engine. -/
def Engine.init (cfg : Config) : Engine := { drainLatch := cfg.consoleLog }

/-- Operations a caller issues. The engine runs them one at a time in issue order. -/
inductive Op where
  | request (c : Cmd)
  | close
  deriving DecidableEq, Repr

/-- How an operation settles. -/
inductive Outcome where
  /-- `request` settled with the backend's JSON-RPC result or error. -/
  | response (r : Resp)
  /-- `request` rejected with `engine is closed`. -/
  | rejected
  /-- `close` resolved. -/
  | closeOk
  deriving DecidableEq, Repr

/-- One JSON-RPC call the engine made to its backend. -/
structure BackendCall where
  id : Nat
  /-- The call is `tevm_drainConsoleLogs`. -/
  drain : Bool
  deriving DecidableEq, Repr

/-- The observable result of one operation. -/
structure StepOut where
  outcome : Outcome
  /-- Backend calls made by this operation, in order. -/
  sent : List BackendCall
  deriving DecidableEq, Repr

/-- Methods after which the engine drains console logs. -/
def Cmd.executesCode : Cmd → Bool
  | .call _ | .callInvalid => true
  | _ => false

/-- One engine operation. -/
def Engine.step (cfg : Config) (e : Engine) : Op → Engine × StepOut
  | .request c =>
    if e.closed then (e, ⟨.rejected, []⟩)
    else
      let r := e.node.step c
      if c.executesCode && e.drainLatch then
        ({ e with lastId := e.lastId + 2, drainLatch := cfg.backendDrains, node := r.1 },
          ⟨.response r.2, [⟨e.lastId + 1, false⟩, ⟨e.lastId + 2, true⟩]⟩)
      else
        ({ e with lastId := e.lastId + 1, node := r.1 },
          ⟨.response r.2, [⟨e.lastId + 1, false⟩]⟩)
  | .close =>
    if e.closed then (e, ⟨.closeOk, []⟩)
    else ({ e with closed := true, backendCloses := e.backendCloses + 1 }, ⟨.closeOk, []⟩)

/-- Run operations in order, collecting every observable result. -/
def Engine.run (cfg : Config) (e : Engine) : List Op → Engine × List StepOut
  | [] => (e, [])
  | op :: ops =>
    let r := e.step cfg op
    let rest := Engine.run cfg r.1 ops
    (rest.1, r.2 :: rest.2)

/-! ### Safety theorems for the engine lifecycle -/

/-- **Closed is absorbing.** No operation changes a closed engine: it stays closed, and
its id counter, latch, backend close count and backend state are frozen. -/
theorem Engine.closed_absorbing (cfg : Config) (e : Engine) (op : Op) (h : e.closed = true) :
    (e.step cfg op).1 = e := by
  cases op <;> simp [Engine.step, h]

/-- **Post-close always rejects.** A request on a closed engine rejects and makes no
backend call. -/
theorem Engine.post_close_rejects (cfg : Config) (e : Engine) (c : Cmd) (h : e.closed = true) :
    (e.step cfg (.request c)).2 = ⟨.rejected, []⟩ := by
  simp [Engine.step, h]

/-- `close` always leaves the engine closed. -/
theorem Engine.close_closes (cfg : Config) (e : Engine) : (e.step cfg .close).1.closed = true := by
  simp only [Engine.step]
  split <;> simp_all

/-- **Close is idempotent.** A second `close` changes nothing, resolves, and calls the
backend zero times. -/
theorem Engine.close_idempotent (cfg : Config) (e : Engine) :
    ((e.step cfg .close).1.step cfg .close) = ((e.step cfg .close).1, ⟨.closeOk, []⟩) := by
  have h := Engine.close_closes cfg e
  generalize (e.step cfg .close).1 = e' at h
  simp [Engine.step, h]

/-- The engine closes its backend exactly when it is closed, and at most once. -/
def Engine.Inv (e : Engine) : Prop :=
  (e.closed = true ∧ e.backendCloses = 1) ∨ (e.closed = false ∧ e.backendCloses = 0)

theorem Engine.inv_init (cfg : Config) : (Engine.init cfg).Inv := Or.inr ⟨rfl, rfl⟩

theorem Engine.inv_step (cfg : Config) (e : Engine) (op : Op) (h : e.Inv) :
    (e.step cfg op).1.Inv := by
  rcases h with ⟨hc, hb⟩ | ⟨hc, hb⟩
  · rw [Engine.closed_absorbing cfg e op hc]
    exact Or.inl ⟨hc, hb⟩
  · cases op with
    | request c =>
      simp only [Engine.step, hc, Bool.false_eq_true, if_false]
      split <;> exact Or.inr ⟨rfl, hb⟩
    | close => exact Or.inl (by simp [Engine.step, hc, hb])

/-- Across any run from a new engine, `backend.close()` runs at most once. -/
theorem Engine.backend_closes_at_most_once (cfg : Config) (ops : List Op) :
    ((Engine.init cfg).run cfg ops).1.backendCloses ≤ 1 := by
  have key : ∀ (ops : List Op) (e : Engine), e.Inv → (e.run cfg ops).1.Inv := by
    intro ops
    induction ops with
    | nil => intro e h; exact h
    | cons op ops ih => intro e h; exact ih _ (Engine.inv_step cfg e op h)
  rcases key ops _ (Engine.inv_init cfg) with ⟨_, hb⟩ | ⟨_, hb⟩ <;> simp [hb]

/-- Once closed, a whole run changes nothing, makes no backend call, and every request
in it rejects. -/
theorem Engine.run_closed (cfg : Config) (ops : List Op) (e : Engine) (h : e.closed = true) :
    (e.run cfg ops).1 = e ∧
    ∀ o ∈ (e.run cfg ops).2, o.sent = [] ∧ (o.outcome = .rejected ∨ o.outcome = .closeOk) := by
  induction ops with
  | nil => exact ⟨rfl, fun o ho => by cases ho⟩
  | cons op ops ih =>
    have hs : (e.step cfg op).1 = e := Engine.closed_absorbing cfg e op h
    simp only [Engine.run, hs]
    refine ⟨ih.1, ?_⟩
    intro o ho
    rcases List.mem_cons.mp ho with ho | ho
    · subst ho
      cases op <;> simp [Engine.step, h]
    · exact ih.2 o ho

/-- **Monotonic request queue.** An operation never lowers the id counter, and it sends
exactly the consecutive ids between the old and the new counter, in order. -/
theorem Engine.ids_monotonic (cfg : Config) (e : Engine) (op : Op) :
    e.lastId ≤ (e.step cfg op).1.lastId ∧
    (e.step cfg op).2.sent.map (·.id) =
      (List.range ((e.step cfg op).1.lastId - e.lastId)).map (e.lastId + 1 + ·) := by
  cases op with
  | request c =>
    simp only [Engine.step]
    split
    · simp
    · split
      · refine ⟨Nat.le_add_right _ _, ?_⟩
        have h2 : e.lastId + 2 - e.lastId = 2 := by omega
        simp [h2, List.range_succ]
      · refine ⟨Nat.le_add_right _ _, ?_⟩
        have h1 : e.lastId + 1 - e.lastId = 1 := by omega
        simp [h1, List.range_succ]
  | close =>
    simp only [Engine.step]
    split <;> simp

/-- An open engine sends every request to its backend under a fresh id. -/
theorem Engine.open_request_sends (cfg : Config) (e : Engine) (c : Cmd) (h : e.closed = false) :
    (e.step cfg (.request c)).2.outcome = .response (e.node.step c).2 ∧
    (e.step cfg (.request c)).2.sent.head? = some ⟨e.lastId + 1, false⟩ := by
  simp only [Engine.step, h, Bool.false_eq_true, if_false]
  split <;> simp

/-- **The console-log latch never re-arms.** Once cleared it stays cleared, and the
engine sends no further `tevm_drainConsoleLogs` call. -/
theorem Engine.latch_stays_cleared (cfg : Config) (e : Engine) (op : Op)
    (h : e.drainLatch = false) :
    (e.step cfg op).1.drainLatch = false ∧ ∀ call ∈ (e.step cfg op).2.sent, call.drain = false := by
  cases op with
  | request c =>
    simp only [Engine.step, h, Bool.and_false]
    split <;> simp [h]
  | close =>
    simp only [Engine.step]
    split <;> simp [h]

/-- **`-32601` clears the latch.** When the backend lacks `tevm_drainConsoleLogs`, the
first code-executing request on an armed, open engine sends one drain call and clears
the latch. -/
theorem Engine.latch_clears_on_method_not_found (e : Engine) (c : Cmd) (consoleLog : Bool)
    (hopen : e.closed = false) (hlatch : e.drainLatch = true) (hc : c.executesCode = true) :
    let r := e.step ⟨consoleLog, false⟩ (.request c)
    r.1.drainLatch = false ∧
    r.2.sent = [⟨e.lastId + 1, false⟩, ⟨e.lastId + 2, true⟩] := by
  simp [Engine.step, hopen, hlatch, hc]

/-- Without the `consoleLog` option the engine never drains. -/
theorem Engine.no_console_log_no_drain (backendDrains : Bool) (ops : List Op) :
    ∀ o ∈ ((Engine.init ⟨false, backendDrains⟩).run ⟨false, backendDrains⟩ ops).2,
      ∀ call ∈ o.sent, call.drain = false := by
  have key : ∀ (ops : List Op) (e : Engine), e.drainLatch = false →
      ∀ o ∈ (e.run ⟨false, backendDrains⟩ ops).2, ∀ call ∈ o.sent, call.drain = false := by
    intro ops
    induction ops with
    | nil => intro e _ o ho; cases ho
    | cons op ops ih =>
      intro e h o ho
      have hs := Engine.latch_stays_cleared ⟨false, backendDrains⟩ e op h
      rcases List.mem_cons.mp ho with ho | ho
      · subst ho
        exact hs.2
      · exact ih _ hs.1 o ho
  exact key ops _ rfl

end EngineFsm
