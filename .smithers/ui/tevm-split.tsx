/** @jsxImportSource react */
import { createGatewayReactRoot } from "smithers-orchestrator/gateway-react";
import { SimpleWorkflowDashboard } from "smithers-orchestrator/gateway-ui";

createGatewayReactRoot(
	<SimpleWorkflowDashboard
		workflow="tevm-split"
		title="Tevm Monorepo → Multi-Repo Split"
		promptPlaceholder="Leave empty to run the full split (9 repos × extract + docs + UI)"
		inputFromPrompt={() => ({})}
	/>,
);
