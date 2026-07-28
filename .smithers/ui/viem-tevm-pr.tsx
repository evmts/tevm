/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="viem-tevm-pr"
		title="Viem × Tevm Test PR"
		promptPlaceholder="Goal override (optional — default: showcase tevm test library in evmts/viem)"
		inputFromPrompt={(prompt) => (prompt.trim() ? { goal: prompt } : {})}
	/>,
);
