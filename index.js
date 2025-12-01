import {Agent, run, tool} from '@openai/agents'
import axios from 'axios';
import { config } from 'dotenv'
import {z} from 'zod';

config();

const getWeatherTool = tool({
    name: 'get_weather',
    description: 'Return the current weather info for the given city.',
    parameters: z.object({
        city: z.string().describe('name of the city'),
    }),
    execute: async function ({city}) {
        console.log(`Tool called for ${city}`)
        const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`
        const res = await axios.get(url, {responseType: 'text'})
        return `The weather of ${city} is ${res.data}`
    }
})

const agent = new Agent({
    name: 'weatherAgent',
    instructions: 'You are a weather and time zone expert that helps user to get real time weather data along with time zone comparison with Delhi, India.',
    model: 'gpt-5-nano',
    tools: [getWeatherTool]
})

async function main(query = '') {
    const result = await run(agent, query)
    console.log(result.finalOutput)
}

main('What is the weather of Tokyo, San Fransisco and Toronto')