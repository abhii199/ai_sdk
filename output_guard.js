import { Agent, OutputGuardrailTripwireTriggered, run } from "@openai/agents";
import { config } from "dotenv";
import { z } from "zod";

config();

const sqlUotputGuardrailAgent = new Agent({
    name: "SQLQueryAgentWithGuardrails",
    instructions: "An agent that generates SQL queries based on user input but the generated query should not modify, delete or drop table.",
    outputType: z.object({
        reason: z.string().optional().describe('reason if the query is unsafe'),
        isSafe: z.boolean().describe('if query is safe too execute')
    }),
    model: 'gpt-5-nano'
})

const sqlGaurdRail = {
    name: 'Sql Gaurdrail',
    //runInParallel: false,
    execute: async ({ agentOutput }) => {
        const check = await run(sqlUotputGuardrailAgent, agentOutput)
        return {
            outputInfo: check.finalOutput.reason,
            tripwireTriggered: !check.finalOutput.isSafe
        }
    }
}

const sqlAgent = new Agent({
    name: "SQLQueryAgent",
    instructions: `An agent that generates SQL queries based on user input with the reapect to given table structure.
        ----Postgres Schema ----
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            comment_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    outputGuardrails: [sqlGaurdRail],
    model: 'gpt-5-nano'
})



async function main(q = '')  {
    try {
        const result = await run(sqlAgent, q)
        console.log(result.finalOutput)
    } catch (e) {
        if (e instanceof OutputGuardrailTripwireTriggered) {
            console.log(e.message)
        }else   console.log("Error", e)
    }
}

main("Fetch all comments along with their users.")