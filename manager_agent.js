import { Agent, run, tool } from "@openai/agents";
import { config } from "dotenv";
import fs from 'node:fs/promises';
import { z } from "zod";

config()

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

const salesAgent = new Agent({
    name: "sales_agent",
    instructions: `You are a sales agent for Broadband company that helps in user's query resolution.`,
    tools: [plan_data, refundAgent.asTool({
        toolName: 'refund_processor',
        toolDescription: 'agent for managing refunds of users'
    })],
    model: 'gpt-5-nano'
})

async function main(query) {
    const result = await run(salesAgent, query)
    console.log(result.finalOutput)
}

main(`Hey there, Want refund for custId '545678' because 'Now I don"t want it.'`)