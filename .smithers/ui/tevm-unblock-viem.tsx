/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="tevm-unblock-viem"
		title="Tevm — Fix the Blockers Keeping Anvil Alive"
		promptPlaceholder="Leave empty to fix all documented gaps"
		inputFromPrompt={() => ({})}
	/>,
);
