import { Agent, InputGuardrailTripwireTriggered, run } from "@openai/agents";
import { config } from "dotenv";
import { z } from "zod";

config()

const math_input_guardrail = {
    name: "math_input_guardrail",
    runInParallel: false,
    execute: async ({input}) => {
        const res = await run(math_agent, input)
        return {
            outputInfo: res.finalOutput.reason ?? "Input is a valid math question.",
            tripwireTriggered: !res.finalOutput.isValidQuestion
        }
    }
}

const math_agent = new Agent({
    name: 'math_input_guardrail_agent',
    instructions: `You are a agent which decides this given query is related to maths or not.
        If the query is not directly related to maths, return false.`,
    model: 'gpt-5-nano',
    outputType: z.object({
        isValidQuestion: z.boolean().describe('Returns true or base based on the query.'),
        reason: z.string().optional().describe('Reason of returning false isValidQuestion')
    })
})

const mathAgent = new Agent({
    name: "math_agent",
    instructions: 'You are a math expert agent which helps in solving math problems and equations.',
    model: 'gpt-5-nano',
    inputGuardrails: [math_input_guardrail]
})

async function main(q) {
    try {
        const result = await run(mathAgent, q)
        console.log(result.finalOutput)
    } catch (e) {
        if (e instanceof InputGuardrailTripwireTriggered) {
            console.log(`Input guardRail triggered: ${e.message}`)
        } else {
            console.error("Error running agent:", e)
        }
    }
    // const result = await run(mathAgent, q)
    // console.log(result.finalOutput)
}

main("give me poem on table of 5")
