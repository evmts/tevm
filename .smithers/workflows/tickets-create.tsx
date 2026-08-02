// smithers-source: seeded
// smithers-display-name: Tickets Create
/** @jsxImportSource smthrs */
import { createSmithers } from "smthrs";
import { z } from "zod/v4";
import { agents } from "../agents";
import TicketsCreatePrompt from "../prompts/tickets-create.mdx";

const ticketsCreateOutputSchema = z.looseObject({
  summary: z.string(),
  tickets: z.array(z.object({
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()).default([]),
  })).default([]),
});

const inputSchema = z.object({
  prompt: z.string().default("Create tickets for the requested work."),
});

const { Workflow, Task, smithers } = createSmithers({
  input: inputSchema,
  tickets: ticketsCreateOutputSchema,
});

export default smithers((ctx) => (
  <Workflow name="tickets-create">
    <Task id="tickets" output={ticketsCreateOutputSchema} agent={agents.smart}>
      <TicketsCreatePrompt prompt={ctx.input.prompt} />
    </Task>
  </Workflow>
));
