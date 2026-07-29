/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="parallel-quality"
		title="Parallel Quality — Review, Docs, Coverage, JSDoc"
		promptPlaceholder="Leave empty to run all quality lanes"
		inputFromPrompt={() => ({})}
	/>,
);
