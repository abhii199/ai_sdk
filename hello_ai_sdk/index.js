import {Agent, run} from '@openai/agents'
import { config } from 'dotenv'

config();

const helloAgent = new Agent({
    name: "Hello Agent",
    instructions: "You are an agent that always says hello world with users name. ",
    model: 'gpt-5-nano'
})

await run(helloAgent, "Hey I'm Abhishek yadav").then(
    result => {
        console.log(result.finalOutput)
    }
)
