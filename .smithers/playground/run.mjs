async function run({ method, bytecode, calldata, gas }) {
  const { createMemoryClient } = await import("../../packages/memory-client/dist/index.js")
  const client = createMemoryClient()
  const rpc = (method, params) => client.transport.tevm.request({ method, params })
  try {
    const limit = BigInt(gas)
    const deployment = method === "deploy"
      ? await client.tevmDeploy({ bytecode, gas: limit })
      : null
    const to = deployment?.createdAddress ?? address
    if (method === "deploy" && deployment?.createdAddress === undefined) {
      throw new PlaygroundError("Contract creation failed")
    }
    if (deployment === null) {
      await client.tevmSetAccount({ address, deployedBytecode: bytecode })
    }
    const call = { to, data: calldata, gas: "0x" + gas.toString(16) }
    const trace = summarize(await rpc("debug_traceCall", [call, "latest", { disableStack: true, disableStorage: true }]))
    return deployment === null ? trace : { address: to, deploymentGasUsed: deployment.receipt?.gasUsed, ...trace }
  } finally {
    await client.tevmClose()
  }
}

const maxGas = 250_000
const address = "0x0000000000000000000000000000000000000123"
const methods = new Set(["call", "deploy"])
const hex = /^0x(?:[0-9a-f]{2})*$/i

class PlaygroundError extends Error {}

function request(input) {
  if (input === null || typeof input !== "object" || !methods.has(input.method)) {
    throw new PlaygroundError("Choose a supported operation")
  }
  const { method, bytecode = "0x", calldata = "0x", gas = 100_000 } = input
  if (typeof bytecode !== "string" || bytecode.length > 4098 || !hex.test(bytecode)) {
    throw new PlaygroundError("Enter up to 2048 bytes of hex bytecode")
  }
  if (typeof calldata !== "string" || calldata.length > 2050 || !hex.test(calldata)) {
    throw new PlaygroundError("Enter up to 1024 bytes of hex calldata")
  }
  if (!Number.isSafeInteger(gas) || gas < 21_000 || gas > maxGas) {
    throw new PlaygroundError("Set a gas limit between 21000 and 250000")
  }
  return { method, bytecode, calldata, gas }
}

function summarize(trace) {
  if (!Array.isArray(trace?.structLogs)) throw new PlaygroundError("Trace unavailable")
  return {
    gasUsed: trace.gas,
    failed: trace.failed,
    returnValue: trace.returnValue,
    truncated: trace.truncated === true || trace.structLogs.length > 256,
    steps: trace.structLogs.slice(0, 256).map(({ pc, op, gas, gasCost, depth }) => ({
      pc, op, gas, gasCost, depth
    }))
  }
}

let response
try {
  const [raw, extra] = process.argv.slice(2)
  if (typeof raw !== "string" || raw.length > 8192 || extra !== undefined) {
    throw new PlaygroundError("Send one JSON request of up to 8192 characters")
  }
  let input
  try {
    input = JSON.parse(raw)
  } catch {
    throw new PlaygroundError("Enter valid JSON")
  }
  response = await run(request(input))
} catch (error) {
  response = { error: error instanceof PlaygroundError ? error.message : "Execution unavailable" }
}
console.log(JSON.stringify(response))
