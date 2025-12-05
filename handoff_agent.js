import { Agent, run, tool } from '@openai/agents';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { config } from 'dotenv';
import fs from 'node:fs/promises';
import { z } from 'zod';

config()

const refund_tool = tool({
    name: 'manage_refunds',
    description: `You handles refunds of users by taking query and reasons.`,
    parameters: z.object({
        cusId: z.string().describe('Customer id of the user'),
        reason: z.string().describe('Reason of the refund.')
    }),
    execute: async function ({ cusId, reason }) {
        await fs.appendFile('./refund.txt', `Refund for Customer having Id ${cusId} for ${reason}\n`, "utf-8")
        return {refundProcessed: true}
    }
})

const refundAgent = new Agent({
    name: 'refund_agent',
    instructions: `You are refund agent which handles refunds.`,
    tools: [refund_tool],
    model: 'gpt-5-nano'
})

const plan_data = tool({
    name: 'sales_tool',
    description: `Logs all the plan data of the available plans with prices.`,
    parameters: z.object({}),
    execute: async function () {
        const planData = [
            {plan_id: '1', price: 500, speed: '300mb/s'},
            {plan_id: '2', price: 600, speed: '500mb/s'},
            {plan_id: '3', price: 900, speed: '800mb/s'}
        ]
        return planData;
    }
})

const salesAgent = new Agent({
    name: "sales_agent",
    instructions: `You are a sales agent for Broadband company that helps in user's query resolution.`,
    tools: [plan_data],
    model: 'gpt-5-nano'
})

const reecptionAgent = new Agent({
    name: 'reception_agent',
    instructions: ` ${RECOMMENDED_PROMPT_PREFIX}
    You are the customer facing agent expert in understanding customers needs and route or handoff them to the right agent.`,
    handoffDescription: `You have two agents available:
    -salesAgent: Expert in handeling queries like all plans amd primcing available. Good for new customers.
    -refundAgent: Expert in handeling queries for existing customers to issue refunds and help them.`,
    handoffs: [salesAgent, refundAgent],
    model: 'gpt-5-nano'
})

async function main(query) {
    const result = await run(reecptionAgent, query)
    console.log(`Result: `,result.finalOutput)
    console.log(`History:`,result.history)
}

main(`Hi there I am customer having id 24 and I want to have refund request as Im facing slow speed internet issue.`)