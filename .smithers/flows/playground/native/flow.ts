import { Action, Flow } from "@smthrs/flow"
import { Node } from "@smthrs/plan"
import { Config, Effect, Schema } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/process"

const version = "playground/native-v1"
const payload = Schema.Struct({
  input: Schema.Struct({ args: Schema.String.check(Schema.isMaxLength(8192)) })
})

class ExecutionFailed extends Schema.TaggedError<ExecutionFailed>()("PlaygroundExecutionFailed", {}) {}

const Execute = Action.make("playground/execute-native", {
  implementationVersion: version,
  payload,
  success: Schema.Json,
  error: ExecutionFailed
})

export const layer = Execute.toLayer(
  (request) =>
    Effect.gen(function*() {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
      const path = yield* Config.String("PATH")
      const args = request.input.args
      const command = ChildProcess.make("node", [".smithers/playground/run.mjs", args], {
        extendEnv: false,
        env: { PATH: path },
        stdin: "ignore"
      })
      const stdout = yield* spawner.string(command)
      return yield* Schema.decodeEffect(Schema.fromJsonString(Schema.Json))(stdout)
    }).pipe(
      Effect.timeout("10 seconds"),
      Effect.mapError(() => new ExecutionFailed())
    ),
  { implementationVersion: version }
)

export default Flow.make("playground/native", {
  description: "Execute bounded local EVM requests and return their opcode trace",
  capabilities: ["fs:read:**", "proc:spawn:node .smithers/playground/run.mjs *"],
  effects: { reads: [".smithers/playground/**", "packages/**", "node_modules/**"], writes: [], mode: "expected", onConflict: "serialize" },
  modelInvocable: false,
  payload,
  success: Schema.Json,
  error: ExecutionFailed,
  body: Node.capture({ version }, (input: typeof payload.Type) => Execute.call(input))
})
