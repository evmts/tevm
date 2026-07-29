/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="viem-deanvil"
		title="Viem — Remove Anvil, Go Idiomatic Tevm"
		promptPlaceholder="Leave empty to run the full de-anvil migration"
		inputFromPrompt={() => ({})}
	/>,
);
