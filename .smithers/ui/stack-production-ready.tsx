/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="stack-production-ready"
		title="Stack — Production Ready & Published"
		promptPlaceholder="Leave empty to audit and prepare the whole stack"
		inputFromPrompt={() => ({})}
	/>,
);
