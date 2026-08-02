// smithers-source: seeded
// smithers-display-name: Ticket Create
/** @jsxImportSource smthrs */
import { createSmithers } from "smthrs";
import { z } from "zod/v4";
import { agents } from "../agents";
import TicketPrompt from "../prompts/ticket.mdx";

const ticketCreateOutputSchema = z.looseObject({
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()).default([]),
});

const inputSchema = z.object({
  prompt: z.string().default("Create a ticket for the requested work."),
});

const { Workflow, Task, smithers } = createSmithers({
  input: inputSchema,
  ticket: ticketCreateOutputSchema,
});

export default smithers((ctx) => (
  <Workflow name="ticket-create">
    <Task id="ticket" output={ticketCreateOutputSchema} agent={agents.smart}>
      <TicketPrompt prompt={ctx.input.prompt} />
    </Task>
  </Workflow>
));
