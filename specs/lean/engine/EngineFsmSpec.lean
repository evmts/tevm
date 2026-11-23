/-!
# TEVM engine lifecycle and EVM snapshot/revert state machine

Executable reference specification for `createZevmEngine` (`packages/node`) and the
ZEVM dev-node state it fronts. Pure Lean 4 core: no Mathlib, no network dependencies.

* Part 1 models the EVM dev-node state: accounts (balance, nonce, code, storage), the
  block number, and the `evm_snapshot` / `evm_revert` store.
* Part 2 models the `ZevmEngine` lifecycle: initialization (`ready`) and its failure,
  open/closed, the monotonic JSON-RPC id counter of the serialized request queue, typed
  `request` and raw `rpc` passthrough (single, batch, malformed), close idempotency when
  `backend.close()` throws, post-close rejection, the `close` event, and the console-log
  drain after the four code-executing methods: the latch that clears on `-32601`, and
  the isolation of every other drain failure from the caller's result.

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
  /-- `eth_estimateGas [{to: a}]`. Modeled only for accounts without code. -/
  | estimateGas (a : Nat)
  /-- `eth_estimateGas []`: malformed parameters. -/
  | estimateGasInvalid
  /-- `eth_sendTransaction []`: malformed parameters. The node rejects it unchanged. -/
  | sendTransactionInvalid
  /-- `eth_sendRawTransaction []`: malformed parameters. The node rejects it unchanged. -/
  | sendRawTransactionInvalid
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

/-- JSON-RPC `Invalid Request`: the answer to an empty batch. -/
def invalidRequest : Resp := .error (-32600)

/-- JSON-RPC `Parse error`: the answer to text that is not JSON. -/
def parseError : Resp := .error (-32700)

/-- Intrinsic gas of a plain call: the `eth_estimateGas` answer for an account without code. -/
def intrinsicGas : Nat := 21000

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
  | .estimateGas a => (n, if (n.world.get a).code = "" then .quantity intrinsicGas else .unmodeled)
  | .estimateGasInvalid => (n, invalidParams)
  | .sendTransactionInvalid => (n, invalidParams)
  | .sendRawTransactionInvalid => (n, invalidParams)
  | .unknown => (n, methodNotFound)

/-- Run commands in order and keep the final node. -/
def Node.run (n : Node) (cs : List Cmd) : Node := cs.foldl (fun n c => (n.step c).1) n

/-- Run commands in order, keeping the final node and every response in order. -/
def Node.stepAll (n : Node) : List Cmd → Node × List Resp
  | [] => (n, [])
  | c :: cs =>
    let r := n.step c
    let rest := Node.stepAll r.1 cs
    (rest.1, r.2 :: rest.2)

/-- Every saved snapshot id is below the id counter. -/
def Node.WF (n : Node) : Prop := ∀ s ∈ n.snapshots, s.id < n.nextSnapshotId

/-- Commands that never change the node. -/
def Cmd.isRead : Cmd → Bool
  | .getBalance _ | .getTransactionCount _ | .getCode _ | .getStorageAt _ _
  | .blockNumber | .call _ | .callInvalid | .estimateGas _ | .estimateGasInvalid
  | .sendTransactionInvalid | .sendRawTransactionInvalid | .unknown => true
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

/-- The JSON-RPC method a command sends. -/
def Cmd.method : Cmd → String
  | .setBalance .. => "anvil_setBalance"
  | .setNonce .. => "anvil_setNonce"
  | .setCode .. => "anvil_setCode"
  | .setStorageAt .. => "anvil_setStorageAt"
  | .mine _ => "evm_mine"
  | .snapshot => "evm_snapshot"
  | .revert _ => "evm_revert"
  | .getBalance _ => "eth_getBalance"
  | .getTransactionCount _ => "eth_getTransactionCount"
  | .getCode _ => "eth_getCode"
  | .getStorageAt .. => "eth_getStorageAt"
  | .blockNumber => "eth_blockNumber"
  | .call _ | .callInvalid => "eth_call"
  | .estimateGas _ | .estimateGasInvalid => "eth_estimateGas"
  | .sendTransactionInvalid => "eth_sendTransaction"
  | .sendRawTransactionInvalid => "eth_sendRawTransaction"
  | .unknown => "eth_specUnknownMethod"

/-- `CONSOLE_LOG_METHODS`: the methods that execute EVM code, after which the engine
drains console logs. -/
def consoleLogMethods : List String :=
  ["eth_call", "eth_estimateGas", "eth_sendTransaction", "eth_sendRawTransaction"]

/-- The engine drains console logs after this command. The decision reads the method
name only: a request the backend rejects still drains. -/
def Cmd.executesCode (c : Cmd) : Bool := consoleLogMethods.contains c.method

/-- How the backend answers `tevm_drainConsoleLogs`. -/
inductive DrainMode where
  /-- It answers with the captured entries. -/
  | supported
  /-- It answers `-32601`: the backend predates console capture. -/
  | unsupported
  /-- It fails any other way: another JSON-RPC error, a thrown transport fault, or text
  that is not a JSON-RPC response. -/
  | fails
  deriving DecidableEq, Repr

/-- What initialization (`ready`) does before the first caller operation. -/
inductive InitMode where
  /-- No option needs a backend call. -/
  | none
  /-- One configuration call (`evm_setAutomine`), which the backend accepts. -/
  | ok
  /-- One configuration call, which the backend rejects. -/
  | fails
  deriving DecidableEq, Repr

/-- Engine construction options and backend behaviours that the model observes. -/
structure Config where
  /-- The `consoleLog` option is set, so the engine drains console logs. -/
  consoleLog : Bool
  /-- How the backend answers `tevm_drainConsoleLogs`. -/
  drain : DrainMode
  /-- What initialization does. -/
  init : InitMode := .none
  /-- `backend.close()` throws. -/
  closeThrows : Bool := false
  deriving DecidableEq, Repr

/-- Engine state. -/
structure Engine where
  /-- The engine is closed: by `close()`, or by a failed initialization. -/
  closed : Bool := false
  /-- Initialization failed. Implies `closed`. -/
  initFailed : Bool := false
  /-- The last JSON-RPC id the engine issued to its backend. -/
  lastId : Nat := 0
  /-- `consoleLogSupported`: the engine still drains console logs. -/
  drainLatch : Bool
  /-- How many times the engine called `backend.close()`. -/
  backendCloses : Nat := 0
  /-- How many `close` events the engine emitted. -/
  closeEvents : Nat := 0
  /-- The backend's state. -/
  node : Node := {}
  deriving DecidableEq, Repr

/-- One JSON-RPC call the engine made to its backend. -/
structure BackendCall where
  /-- The id the engine issued. `none` for a raw `rpc` payload, which reaches the backend
  verbatim with the caller's own ids. -/
  id : Option Nat
  /-- The call is `tevm_drainConsoleLogs`. -/
  drain : Bool
  deriving DecidableEq, Repr

/-- The engine after initialization settles. A failed initialization closes the backend
once, emits `close` once and leaves the engine closed. -/
def Engine.init (cfg : Config) : Engine :=
  match cfg.init with
  | .none => { drainLatch := cfg.consoleLog }
  | .ok => { drainLatch := cfg.consoleLog, lastId := 1 }
  | .fails =>
    { drainLatch := cfg.consoleLog, lastId := 1, closed := true, initFailed := true,
      backendCloses := 1, closeEvents := 1 }

/-- Backend calls made by initialization. -/
def Engine.initSent (cfg : Config) : List BackendCall :=
  match cfg.init with
  | .none => []
  | _ => [⟨some 1, false⟩]

/-- A raw JSON-RPC payload handed to `engine.rpc(json)`. -/
inductive Payload where
  /-- One request object. -/
  | single (c : Cmd)
  /-- A batch array. The empty batch is an invalid request. -/
  | batch (cs : List Cmd)
  /-- Text that is not JSON. -/
  | malformed
  deriving DecidableEq, Repr

/-- The raw JSON-RPC answer to a payload. Errors are in-band values, never rejections. -/
inductive RawResp where
  /-- One response object. -/
  | single (r : Resp)
  /-- A batch array, in request order. -/
  | batch (rs : List Resp)
  deriving DecidableEq, Repr

/-- One raw backend call. -/
def Node.raw (n : Node) : Payload → Node × RawResp
  | .single c => ((n.step c).1, .single (n.step c).2)
  | .batch [] => (n, .single invalidRequest)
  | .batch (c :: cs) => ((n.stepAll (c :: cs)).1, .batch (n.stepAll (c :: cs)).2)
  | .malformed => (n, .single parseError)

/-- `executesConsoleLogMethod`: some request in the payload names a code-executing method. -/
def Payload.executesCode : Payload → Bool
  | .single c => c.executesCode
  | .batch cs => cs.any Cmd.executesCode
  | .malformed => false

/-- Operations a caller issues. The engine runs them one at a time in issue order. -/
inductive Op where
  /-- `engine.request({method, params})` -/
  | request (c : Cmd)
  /-- `engine.rpc(json)` -/
  | rpc (p : Payload)
  /-- `engine.ready()` -/
  | ready
  /-- `engine.close()` -/
  | close
  deriving DecidableEq, Repr

/-- How an operation settles. -/
inductive Outcome where
  /-- `request` settled with the backend's JSON-RPC result or error. -/
  | response (r : Resp)
  /-- `rpc` resolved with the backend's raw answer. -/
  | raw (r : RawResp)
  /-- `request` or `rpc` rejected with `engine is closed`. -/
  | rejected
  /-- `request`, `rpc` or `ready` rejected with the initialization error. -/
  | initFailed
  /-- `ready` resolved. -/
  | readyOk
  /-- `close` resolved. -/
  | closeOk
  /-- `close` rejected with the error `backend.close()` threw. The engine is closed. -/
  | closeFailed
  deriving DecidableEq, Repr

/-- The observable result of one operation. -/
structure StepOut where
  outcome : Outcome
  /-- Backend calls made by this operation, in order. -/
  sent : List BackendCall
  deriving DecidableEq, Repr

/-- The post-dispatch console-log drain. It runs when `fire` holds and the latch is armed.
It changes the id counter and the latch and nothing else: whatever the backend answers,
the drain cannot touch the result the caller is about to receive. Only `-32601` clears
the latch. -/
def Engine.drain (cfg : Config) (e : Engine) (fire : Bool) : Engine × List BackendCall :=
  if fire && e.drainLatch then
    ({ e with lastId := e.lastId + 1, drainLatch := decide (cfg.drain ≠ .unsupported) },
      [⟨some (e.lastId + 1), true⟩])
  else (e, [])

/-- One engine operation. -/
def Engine.step (cfg : Config) (e : Engine) : Op → Engine × StepOut
  | .request c =>
    if e.initFailed then (e, ⟨.initFailed, []⟩)
    else if e.closed then (e, ⟨.rejected, []⟩)
    else
      let d := Engine.drain cfg { e with lastId := e.lastId + 1, node := (e.node.step c).1 }
        c.executesCode
      (d.1, ⟨.response (e.node.step c).2, ⟨some (e.lastId + 1), false⟩ :: d.2⟩)
  | .rpc p =>
    if e.initFailed then (e, ⟨.initFailed, []⟩)
    else if e.closed then (e, ⟨.rejected, []⟩)
    else
      let d := Engine.drain cfg { e with node := (e.node.raw p).1 } p.executesCode
      (d.1, ⟨.raw (e.node.raw p).2, ⟨none, false⟩ :: d.2⟩)
  | .ready => (e, ⟨if e.initFailed then .initFailed else .readyOk, []⟩)
  | .close =>
    if e.closed then (e, ⟨.closeOk, []⟩)
    else
      ({ e with closed := true, backendCloses := e.backendCloses + 1,
                closeEvents := e.closeEvents + 1 },
        ⟨if cfg.closeThrows then .closeFailed else .closeOk, []⟩)

/-- Run operations in order, collecting every observable result. -/
def Engine.run (cfg : Config) (e : Engine) : List Op → Engine × List StepOut
  | [] => (e, [])
  | op :: ops =>
    let r := e.step cfg op
    let rest := Engine.run cfg r.1 ops
    (rest.1, r.2 :: rest.2)

/-! ### The drain touches only the id counter and the latch -/

@[simp] theorem Engine.drain_node (cfg : Config) (e : Engine) (fire : Bool) :
    (e.drain cfg fire).1.node = e.node := by
  unfold Engine.drain; split <;> rfl

@[simp] theorem Engine.drain_closed (cfg : Config) (e : Engine) (fire : Bool) :
    (e.drain cfg fire).1.closed = e.closed := by
  unfold Engine.drain; split <;> rfl

@[simp] theorem Engine.drain_initFailed (cfg : Config) (e : Engine) (fire : Bool) :
    (e.drain cfg fire).1.initFailed = e.initFailed := by
  unfold Engine.drain; split <;> rfl

@[simp] theorem Engine.drain_backendCloses (cfg : Config) (e : Engine) (fire : Bool) :
    (e.drain cfg fire).1.backendCloses = e.backendCloses := by
  unfold Engine.drain; split <;> rfl

@[simp] theorem Engine.drain_closeEvents (cfg : Config) (e : Engine) (fire : Bool) :
    (e.drain cfg fire).1.closeEvents = e.closeEvents := by
  unfold Engine.drain; split <;> rfl

/-- The drain sends at most one call, a `tevm_drainConsoleLogs` under the next id. -/
theorem Engine.drain_sent (cfg : Config) (e : Engine) (fire : Bool) :
    ((e.drain cfg fire).2 = [] ∧ (e.drain cfg fire).1 = e) ∨
    ((e.drain cfg fire).2 = [⟨some (e.lastId + 1), true⟩] ∧
      (e.drain cfg fire).1.lastId = e.lastId + 1 ∧ fire = true ∧ e.drainLatch = true) := by
  unfold Engine.drain
  split
  · rename_i h
    simp only [Bool.and_eq_true] at h
    exact Or.inr ⟨rfl, rfl, h.1, h.2⟩
  · exact Or.inl ⟨rfl, rfl⟩

/-- A cleared latch never drains. -/
theorem Engine.drain_cleared (cfg : Config) (e : Engine) (fire : Bool) (h : e.drainLatch = false) :
    e.drain cfg fire = (e, []) := by
  simp [Engine.drain, h]

/-! ### Code-executing methods -/

/-- A command drains exactly when its method is one of the four code-executing methods. -/
theorem Cmd.executesCode_iff (c : Cmd) :
    c.executesCode = true ↔
      c.method = "eth_call" ∨ c.method = "eth_estimateGas" ∨
      c.method = "eth_sendTransaction" ∨ c.method = "eth_sendRawTransaction" := by
  simp [Cmd.executesCode, consoleLogMethods]

/-- All four code-executing methods drain, including when the backend rejects the request. -/
theorem Cmd.executesCode_all (a : Nat) :
    (Cmd.call a).executesCode = true ∧ Cmd.callInvalid.executesCode = true ∧
    (Cmd.estimateGas a).executesCode = true ∧ Cmd.estimateGasInvalid.executesCode = true ∧
    Cmd.sendTransactionInvalid.executesCode = true ∧
    Cmd.sendRawTransactionInvalid.executesCode = true := by
  simp [Cmd.executesCode, Cmd.method, consoleLogMethods]

/-- No other modeled command drains. -/
theorem Cmd.executesCode_only (c : Cmd) (h : c.executesCode = true) :
    (∃ a, c = .call a) ∨ c = .callInvalid ∨ (∃ a, c = .estimateGas a) ∨
    c = .estimateGasInvalid ∨ c = .sendTransactionInvalid ∨ c = .sendRawTransactionInvalid := by
  cases c <;> simp [Cmd.executesCode, Cmd.method, consoleLogMethods] at h ⊢

/-! ### Safety theorems for the engine lifecycle -/

/-- **Closed is absorbing.** No operation changes a closed engine: it stays closed, and
its id counter, latch, backend close count, `close` event count and backend state are
frozen. -/
theorem Engine.closed_absorbing (cfg : Config) (e : Engine) (op : Op) (h : e.closed = true) :
    (e.step cfg op).1 = e := by
  cases op <;> simp only [Engine.step, h, if_true] <;> (try split) <;> rfl

/-- A closed engine makes no backend call. -/
theorem Engine.closed_sends_nothing (cfg : Config) (e : Engine) (op : Op) (h : e.closed = true) :
    (e.step cfg op).2.sent = [] := by
  cases op <;> simp only [Engine.step, h, if_true] <;> (try split) <;> rfl

/-- **Post-close always rejects.** A `request` or `rpc` on an engine that `close()` closed
rejects with `engine is closed` and makes no backend call. -/
theorem Engine.post_close_rejects (cfg : Config) (e : Engine) (h : e.closed = true)
    (hinit : e.initFailed = false) :
    (∀ c, (e.step cfg (.request c)).2 = ⟨.rejected, []⟩) ∧
    (∀ p, (e.step cfg (.rpc p)).2 = ⟨.rejected, []⟩) := by
  constructor <;> intro _ <;> simp [Engine.step, h, hinit]

/-- **A failed initialization is reported by every later operation.** `request`, `rpc`
and `ready` reject with the initialization error and make no backend call. -/
theorem Engine.init_failed_rejects (cfg : Config) (e : Engine) (h : e.initFailed = true) :
    (∀ c, (e.step cfg (.request c)).2 = ⟨.initFailed, []⟩) ∧
    (∀ p, (e.step cfg (.rpc p)).2 = ⟨.initFailed, []⟩) ∧
    (e.step cfg .ready).2 = ⟨.initFailed, []⟩ := by
  refine ⟨?_, ?_, ?_⟩ <;> (try intro _) <;> simp [Engine.step, h]

/-- `close` always leaves the engine closed, including when `backend.close()` throws. -/
theorem Engine.close_closes (cfg : Config) (e : Engine) : (e.step cfg .close).1.closed = true := by
  simp only [Engine.step]
  split <;> simp_all

/-- **Close is idempotent.** A second `close` changes nothing, resolves, and calls the
backend zero times. This holds for every configuration, so it holds when the first
`backend.close()` threw. -/
theorem Engine.close_idempotent (cfg : Config) (e : Engine) :
    ((e.step cfg .close).1.step cfg .close) = ((e.step cfg .close).1, ⟨.closeOk, []⟩) := by
  have h := Engine.close_closes cfg e
  generalize (e.step cfg .close).1 = e' at h
  simp [Engine.step, h]

/-- **A throwing `backend.close()` still closes the engine.** The first `close` rejects
with the backend's error. The engine is closed, `backend.close()` ran once and `close`
was emitted once. Every later `close` resolves without touching the backend. -/
theorem Engine.close_throws_safe (cfg : Config) (e : Engine) (hopen : e.closed = false)
    (hthrows : cfg.closeThrows = true) :
    let r := e.step cfg .close
    r.2 = ⟨.closeFailed, []⟩ ∧
    r.1.closed = true ∧
    r.1.backendCloses = e.backendCloses + 1 ∧
    r.1.closeEvents = e.closeEvents + 1 ∧
    r.1.step cfg .close = (r.1, ⟨.closeOk, []⟩) := by
  simp [Engine.step, hopen, hthrows]

/-- The engine closes its backend and emits `close` exactly when it becomes closed, each
exactly once. A failed initialization implies closed. -/
def Engine.Inv (e : Engine) : Prop :=
  ((e.closed = true ∧ e.backendCloses = 1 ∧ e.closeEvents = 1) ∨
    (e.closed = false ∧ e.backendCloses = 0 ∧ e.closeEvents = 0)) ∧
  (e.initFailed = true → e.closed = true)

theorem Engine.inv_init (cfg : Config) : (Engine.init cfg).Inv := by
  unfold Engine.init Engine.Inv
  split <;> simp

theorem Engine.inv_step (cfg : Config) (e : Engine) (op : Op) (h : e.Inv) :
    (e.step cfg op).1.Inv := by
  obtain ⟨hcount, hinit⟩ := h
  rcases hcount with ⟨hc, hb, hev⟩ | ⟨hc, hb, hev⟩
  · rw [Engine.closed_absorbing cfg e op hc]
    exact ⟨Or.inl ⟨hc, hb, hev⟩, hinit⟩
  · have hnf : e.initFailed = false := by
      cases hf : e.initFailed with
      | false => rfl
      | true => rw [hinit hf] at hc; cases hc
    cases op with
    | request c =>
      simp only [Engine.step, hc, hnf, Bool.false_eq_true, if_false]
      exact ⟨Or.inr ⟨by simp, by simp [hb], by simp [hev]⟩, by simp⟩
    | rpc p =>
      simp only [Engine.step, hc, hnf, Bool.false_eq_true, if_false]
      exact ⟨Or.inr ⟨by simp, by simp [hb], by simp [hev]⟩, by simp⟩
    | ready => exact ⟨Or.inr ⟨hc, hb, hev⟩, hinit⟩
    | close =>
      simp only [Engine.step, hc, Bool.false_eq_true, if_false]
      exact ⟨Or.inl ⟨rfl, by simp [hb], by simp [hev]⟩, fun _ => rfl⟩

theorem Engine.inv_run (cfg : Config) (ops : List Op) :
    ∀ e : Engine, e.Inv → (e.run cfg ops).1.Inv := by
  induction ops with
  | nil => intro e h; exact h
  | cons op ops ih => intro e h; exact ih _ (Engine.inv_step cfg e op h)

/-- Across any run from a new engine, `backend.close()` runs at most once and `close` is
emitted at most once. This covers a failed initialization and a throwing backend. -/
theorem Engine.backend_closes_at_most_once (cfg : Config) (ops : List Op) :
    ((Engine.init cfg).run cfg ops).1.backendCloses ≤ 1 ∧
    ((Engine.init cfg).run cfg ops).1.closeEvents ≤ 1 := by
  rcases (Engine.inv_run cfg ops _ (Engine.inv_init cfg)).1 with ⟨_, hb, hev⟩ | ⟨_, hb, hev⟩ <;>
    simp [hb, hev]

/-- Across any run from a new engine, the engine is closed exactly when it has closed its
backend once, and exactly when it has emitted `close` once. -/
theorem Engine.closed_iff_close_emitted (cfg : Config) (ops : List Op) :
    let e := ((Engine.init cfg).run cfg ops).1
    (e.closed = true ↔ e.closeEvents = 1) ∧ (e.closed = true ↔ e.backendCloses = 1) := by
  rcases (Engine.inv_run cfg ops _ (Engine.inv_init cfg)).1 with ⟨hc, hb, hev⟩ | ⟨hc, hb, hev⟩ <;>
    simp [hc, hb, hev]

/-- Once closed, a whole run changes nothing, makes no backend call, and no operation in
it reaches the backend's result path. -/
theorem Engine.run_closed (cfg : Config) (ops : List Op) (e : Engine) (h : e.closed = true) :
    (e.run cfg ops).1 = e ∧
    ∀ o ∈ (e.run cfg ops).2, o.sent = [] ∧
      (o.outcome = .rejected ∨ o.outcome = .initFailed ∨ o.outcome = .readyOk ∨
        o.outcome = .closeOk) := by
  induction ops with
  | nil => exact ⟨rfl, fun o ho => by cases ho⟩
  | cons op ops ih =>
    have hs : (e.step cfg op).1 = e := Engine.closed_absorbing cfg e op h
    simp only [Engine.run, hs]
    refine ⟨ih.1, ?_⟩
    intro o ho
    rcases List.mem_cons.mp ho with ho | ho
    · subst ho
      cases op <;> simp only [Engine.step, h, if_true] <;> (try split) <;> simp
    · exact ih.2 o ho

/-- **A failed initialization closes the backend and emits `close`.** The engine starts
closed with exactly one `backend.close()` call and one `close` event. No later operation
changes it or reaches the backend: `request`, `rpc` and `ready` report the initialization
error and `close` resolves. -/
theorem Engine.ready_fail_closes (cfg : Config) (h : cfg.init = .fails) (ops : List Op) :
    (Engine.init cfg).closed = true ∧
    (Engine.init cfg).backendCloses = 1 ∧
    (Engine.init cfg).closeEvents = 1 ∧
    ((Engine.init cfg).run cfg ops).1 = Engine.init cfg ∧
    ∀ o ∈ ((Engine.init cfg).run cfg ops).2,
      o.sent = [] ∧ (o.outcome = .initFailed ∨ o.outcome = .closeOk) := by
  have hc : (Engine.init cfg).closed = true := by simp [Engine.init, h]
  have hf : (Engine.init cfg).initFailed = true := by simp [Engine.init, h]
  refine ⟨hc, by simp [Engine.init, h], by simp [Engine.init, h], ?_⟩
  generalize Engine.init cfg = e at hc hf
  induction ops with
  | nil => exact ⟨rfl, fun o ho => by cases ho⟩
  | cons op ops ih =>
    have hs : (e.step cfg op).1 = e := Engine.closed_absorbing cfg e op hc
    simp only [Engine.run, hs]
    refine ⟨ih.1, ?_⟩
    intro o ho
    rcases List.mem_cons.mp ho with ho | ho
    · subst ho
      cases op <;> simp [Engine.step, hc, hf]
    · exact ih.2 o ho

/-- A successful initialization leaves the engine open with an untouched backend. -/
theorem Engine.ready_ok_open (cfg : Config) (h : cfg.init ≠ .fails) :
    (Engine.init cfg).closed = false ∧ (Engine.init cfg).initFailed = false ∧
    (Engine.init cfg).backendCloses = 0 ∧ (Engine.init cfg).closeEvents = 0 ∧
    ((Engine.init cfg).step cfg .ready).2 = ⟨.readyOk, []⟩ := by
  cases hi : cfg.init <;> simp_all [Engine.init, Engine.step]

/-- Initialization issues the ids `1 .. lastId`, like every later operation. -/
theorem Engine.init_ids (cfg : Config) :
    (Engine.initSent cfg).filterMap (·.id) =
      (List.range (Engine.init cfg).lastId).map (1 + ·) := by
  cases hi : cfg.init <;> simp [Engine.initSent, Engine.init, hi, List.range_succ]

/-- **Monotonic request queue.** An operation never lowers the id counter, and the ids
it issues are exactly the consecutive ids between the old and the new counter, in order.
A raw `rpc` payload carries the caller's ids and consumes none. -/
theorem Engine.ids_monotonic (cfg : Config) (e : Engine) (op : Op) :
    e.lastId ≤ (e.step cfg op).1.lastId ∧
    (e.step cfg op).2.sent.filterMap (·.id) =
      (List.range ((e.step cfg op).1.lastId - e.lastId)).map (e.lastId + 1 + ·) := by
  cases op with
  | request c =>
    simp only [Engine.step]
    split
    · simp
    · split
      · simp
      · rcases Engine.drain_sent cfg
            { e with lastId := e.lastId + 1, node := (e.node.step c).1 } c.executesCode with
          ⟨hs, he⟩ | ⟨hs, hl, _, _⟩
        · rw [hs, he]
          have h1 : e.lastId + 1 - e.lastId = 1 := by omega
          simp [h1, List.range_succ]
        · rw [hs, hl]
          dsimp only
          have h2 : e.lastId + 1 + 1 - e.lastId = 2 := by omega
          refine ⟨by omega, ?_⟩
          simp [h2, List.range_succ]
  | rpc p =>
    simp only [Engine.step]
    split
    · simp
    · split
      · simp
      · rcases Engine.drain_sent cfg { e with node := (e.node.raw p).1 } p.executesCode with
          ⟨hs, he⟩ | ⟨hs, hl, _, _⟩
        · rw [hs, he]
          simp
        · rw [hs, hl]
          dsimp only
          have h1 : e.lastId + 1 - e.lastId = 1 := by omega
          simp [h1, List.range_succ]
  | ready => simp [Engine.step]
  | close =>
    simp only [Engine.step]
    split <;> simp

/-- An open engine sends every request to its backend under a fresh id. -/
theorem Engine.open_request_sends (cfg : Config) (e : Engine) (c : Cmd) (h : e.closed = false)
    (hinit : e.initFailed = false) :
    (e.step cfg (.request c)).2.outcome = .response (e.node.step c).2 ∧
    (e.step cfg (.request c)).2.sent.head? = some ⟨some (e.lastId + 1), false⟩ := by
  simp [Engine.step, h, hinit]

/-- Every operation sends at most one `tevm_drainConsoleLogs` call. A batch that names
several code-executing methods still drains once. -/
theorem Engine.drains_at_most_once (cfg : Config) (e : Engine) (op : Op) :
    ((e.step cfg op).2.sent.filter (·.drain)).length ≤ 1 := by
  cases op with
  | request c =>
    simp only [Engine.step]
    split
    · simp
    · split
      · simp
      · rcases Engine.drain_sent cfg
            { e with lastId := e.lastId + 1, node := (e.node.step c).1 } c.executesCode with
          ⟨hs, _⟩ | ⟨hs, _⟩ <;> simp [hs]
  | rpc p =>
    simp only [Engine.step]
    split
    · simp
    · split
      · simp
      · rcases Engine.drain_sent cfg { e with node := (e.node.raw p).1 } p.executesCode with
          ⟨hs, _⟩ | ⟨hs, _⟩ <;> simp [hs]
  | ready => simp [Engine.step]
  | close =>
    simp only [Engine.step]
    split <;> simp

/-! ### The console-log drain is isolated from RPC results -/

/-- **A drain error never replaces a committed RPC result.** Take two configurations
that differ only in how the backend answers `tevm_drainConsoleLogs`: it succeeds, it
answers `-32601`, or it fails any other way. Every operation settles with the same
outcome and leaves the same backend state, the same open/closed state and the same
close counts. The drain's answer can reach nothing but the latch and the id counter. -/
theorem Engine.result_independent_of_drain (cfg cfg' : Config) (e : Engine) (op : Op)
    (hclose : cfg.closeThrows = cfg'.closeThrows) :
    (e.step cfg op).2.outcome = (e.step cfg' op).2.outcome ∧
    (e.step cfg op).1.node = (e.step cfg' op).1.node ∧
    (e.step cfg op).1.closed = (e.step cfg' op).1.closed ∧
    (e.step cfg op).1.initFailed = (e.step cfg' op).1.initFailed ∧
    (e.step cfg op).1.backendCloses = (e.step cfg' op).1.backendCloses ∧
    (e.step cfg op).1.closeEvents = (e.step cfg' op).1.closeEvents := by
  cases op with
  | request c => simp only [Engine.step]; split <;> (try split) <;> simp
  | rpc p => simp only [Engine.step]; split <;> (try split) <;> simp
  | ready => simp [Engine.step]
  | close => simp [Engine.step, hclose]

/-- **A failing drain after `request`.** On an open, armed engine whose backend fails the
drain, a code-executing request still settles with the backend's own answer and commits
the backend's own state. The engine sent the request and then the drain, and the latch
stays armed: only `-32601` clears it. -/
theorem Engine.request_survives_drain_failure (cfg : Config) (e : Engine) (c : Cmd)
    (hopen : e.closed = false) (hinit : e.initFailed = false) (hlatch : e.drainLatch = true)
    (hc : c.executesCode = true) (hfail : cfg.drain = .fails) :
    let r := e.step cfg (.request c)
    r.2.outcome = .response (e.node.step c).2 ∧
    r.1.node = (e.node.step c).1 ∧
    r.2.sent = [⟨some (e.lastId + 1), false⟩, ⟨some (e.lastId + 2), true⟩] ∧
    r.1.drainLatch = true ∧
    r.1.closed = false := by
  simp [Engine.step, Engine.drain, hopen, hinit, hlatch, hc, hfail]

/-- **A failing drain after `rpc`.** The raw answer and the backend state are the
backend's own, whatever the drain does. -/
theorem Engine.rpc_survives_drain_failure (cfg : Config) (e : Engine) (p : Payload)
    (hopen : e.closed = false) (hinit : e.initFailed = false) :
    let r := e.step cfg (.rpc p)
    r.2.outcome = .raw (e.node.raw p).2 ∧ r.1.node = (e.node.raw p).1 ∧ r.1.closed = false := by
  simp [Engine.step, hopen, hinit]

/-- A failing drain leaves the latch as it was: the engine tries again after the next
code-executing request. -/
theorem Engine.drain_failure_keeps_latch (cfg : Config) (e : Engine) (op : Op)
    (hfail : cfg.drain = .fails) : (e.step cfg op).1.drainLatch = e.drainLatch := by
  cases op with
  | request c =>
    simp only [Engine.step, Engine.drain, hfail]
    split <;> (try split) <;> (try split) <;> simp_all
  | rpc p =>
    simp only [Engine.step, Engine.drain, hfail]
    split <;> (try split) <;> (try split) <;> simp_all
  | ready => simp [Engine.step]
  | close => simp only [Engine.step]; split <;> simp

/-- **The console-log latch never re-arms.** Once cleared it stays cleared, and the
engine sends no further `tevm_drainConsoleLogs` call. -/
theorem Engine.latch_stays_cleared (cfg : Config) (e : Engine) (op : Op)
    (h : e.drainLatch = false) :
    (e.step cfg op).1.drainLatch = false ∧ ∀ call ∈ (e.step cfg op).2.sent, call.drain = false := by
  cases op with
  | request c =>
    simp only [Engine.step]
    split
    · simp [h]
    · split
      · simp [h]
      · rw [Engine.drain_cleared _ _ _ (by simpa using h)]
        simp [h]
  | rpc p =>
    simp only [Engine.step]
    split
    · simp [h]
    · split
      · simp [h]
      · rw [Engine.drain_cleared _ _ _ (by simpa using h)]
        simp [h]
  | ready => simp [Engine.step, h]
  | close =>
    simp only [Engine.step]
    split <;> simp [h]

/-- **`-32601` clears the latch.** When the backend lacks `tevm_drainConsoleLogs`, the
first code-executing request on an armed, open engine sends one drain call and clears
the latch. -/
theorem Engine.latch_clears_on_method_not_found (cfg : Config) (e : Engine) (c : Cmd)
    (hopen : e.closed = false) (hinit : e.initFailed = false) (hlatch : e.drainLatch = true)
    (hc : c.executesCode = true) (hdrain : cfg.drain = .unsupported) :
    let r := e.step cfg (.request c)
    r.1.drainLatch = false ∧
    r.2.sent = [⟨some (e.lastId + 1), false⟩, ⟨some (e.lastId + 2), true⟩] := by
  simp [Engine.step, Engine.drain, hopen, hinit, hlatch, hc, hdrain]

/-- Without the `consoleLog` option the engine never drains. -/
theorem Engine.no_console_log_no_drain (cfg : Config) (hcfg : cfg.consoleLog = false)
    (ops : List Op) :
    ∀ o ∈ ((Engine.init cfg).run cfg ops).2, ∀ call ∈ o.sent, call.drain = false := by
  have key : ∀ (ops : List Op) (e : Engine), e.drainLatch = false →
      ∀ o ∈ (e.run cfg ops).2, ∀ call ∈ o.sent, call.drain = false := by
    intro ops
    induction ops with
    | nil => intro e _ o ho; cases ho
    | cons op ops ih =>
      intro e h o ho
      have hs := Engine.latch_stays_cleared cfg e op h
      rcases List.mem_cons.mp ho with ho | ho
      · subst ho
        exact hs.2
      · exact ih _ hs.1 o ho
  refine key ops _ ?_
  unfold Engine.init
  split <;> exact hcfg

/-! ### Raw `rpc` passthrough -/

theorem Node.stepAll_fst (cs : List Cmd) : ∀ n : Node, (n.stepAll cs).1 = n.run cs := by
  induction cs with
  | nil => intro n; rfl
  | cons c cs ih => intro n; simp only [Node.stepAll, Node.run, List.foldl_cons]; exact ih _

theorem Node.stepAll_length (cs : List Cmd) : ∀ n : Node, (n.stepAll cs).2.length = cs.length := by
  induction cs with
  | nil => intro n; rfl
  | cons c cs ih => intro n; simp [Node.stepAll, ih]

/-- **Raw passthrough reaches the backend verbatim.** An open engine forwards the payload
as one backend call that carries no engine id, resolves with the backend's raw answer and
consumes an engine id only for the drain. -/
theorem Engine.rpc_passthrough (cfg : Config) (e : Engine) (p : Payload)
    (hopen : e.closed = false) (hinit : e.initFailed = false) :
    (e.step cfg (.rpc p)).2.outcome = .raw (e.node.raw p).2 ∧
    (e.step cfg (.rpc p)).2.sent.head? = some ⟨none, false⟩ ∧
    (e.step cfg (.rpc p)).1.lastId ≤ e.lastId + 1 ∧
    (p.executesCode = false →
      (e.step cfg (.rpc p)).1.lastId = e.lastId ∧
      (e.step cfg (.rpc p)).2.sent = [⟨none, false⟩]) := by
  refine ⟨?_, ?_, ?_, ?_⟩
  · simp [Engine.step, hopen, hinit]
  · simp [Engine.step, hopen, hinit]
  · simp only [Engine.step, hopen, hinit, Bool.false_eq_true, if_false, Engine.drain]
    split <;> simp
  · intro hp
    simp [Engine.step, Engine.drain, hopen, hinit, hp]

/-- A single raw request has the same effect and answer as the typed `request`. -/
theorem Engine.rpc_single_matches_request (cfg : Config) (e : Engine) (c : Cmd)
    (hopen : e.closed = false) (hinit : e.initFailed = false) :
    (e.step cfg (.rpc (.single c))).1.node = (e.step cfg (.request c)).1.node ∧
    (e.step cfg (.rpc (.single c))).2.outcome = .raw (.single (e.node.step c).2) ∧
    (e.step cfg (.request c)).2.outcome = .response (e.node.step c).2 ∧
    (e.step cfg (.rpc (.single c))).1.drainLatch = (e.step cfg (.request c)).1.drainLatch := by
  refine ⟨?_, ?_, ?_, ?_⟩
  · simp [Engine.step, hopen, hinit, Node.raw]
  · simp [Engine.step, hopen, hinit, Node.raw]
  · simp [Engine.step, hopen, hinit]
  · simp only [Engine.step, hopen, hinit, Bool.false_eq_true, if_false, Node.raw,
      Payload.executesCode, Engine.drain]
    split <;> simp [*]

/-- **A batch runs in order.** A non-empty batch applies every command in request order
and answers once per command. -/
theorem Engine.rpc_batch_in_order (cfg : Config) (e : Engine) (cs : List Cmd)
    (hopen : e.closed = false) (hinit : e.initFailed = false) (hne : cs ≠ []) :
    (e.step cfg (.rpc (.batch cs))).1.node = e.node.run cs ∧
    ∃ rs, (e.step cfg (.rpc (.batch cs))).2.outcome = .raw (.batch rs) ∧ rs.length = cs.length := by
  cases cs with
  | nil => exact absurd rfl hne
  | cons c cs =>
    simp only [Engine.step, hopen, hinit, Bool.false_eq_true, if_false, Node.raw,
      Engine.drain_node]
    exact ⟨Node.stepAll_fst _ _, _, rfl, Node.stepAll_length _ _⟩

/-- An empty batch and malformed text answer an in-band error, leave the backend state
unchanged and never drain. -/
theorem Engine.rpc_invalid_payload (cfg : Config) (e : Engine)
    (hopen : e.closed = false) (hinit : e.initFailed = false) :
    e.step cfg (.rpc (.batch [])) = (e, ⟨.raw (.single invalidRequest), [⟨none, false⟩]⟩) ∧
    e.step cfg (.rpc .malformed) = (e, ⟨.raw (.single parseError), [⟨none, false⟩]⟩) := by
  cases e
  simp_all [Engine.step, Engine.drain, Node.raw, Payload.executesCode]

end EngineFsm
