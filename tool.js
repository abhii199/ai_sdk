import { Agent, run, tool } from '@openai/agents';
import axios from 'axios';
import { config } from 'dotenv';
import Nodemailer from 'nodemailer';
import { z } from 'zod';


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

const sendMail = tool({
    name: 'send_email',
    description: 'sends email to the user with given credentials',
    parameters: z.object({
        toEmail: z.string().email().describe('email address to'),
        subject: z.string().describe('subject of the email'),
        body: z.string().describe('conntent of the email')
    }),
    execute: async function ({ toEmail, subject, body }) {
        const transport = Nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            }

        });
        
        await transport
            .sendMail({
                from: process.env.MAILTRAP_USER,
                to: toEmail,
                subject: subject,
                text: body,
                category: "Integration Test",
            })
            .then  
            ((info) => {
                return {
                    success: true,
                    message: `Email sent successfully to ${toEmail}. Message ID: ${info.messageId}`,
                    info: info
                }
            }           
            )
            .catch((error) => {
                return {
                    success: false,
                    message: `Failed to send email to ${toEmail}. Error: ${error.message}`,
                    error: error
                }
            });
        
    }
})
        

const agent = new Agent({
    name: 'weatherAgent',
    instructions: 'You are a weather and time zone expert that helps user to get real time weather data along with time zone comparison with Delhi, India.',
    model: 'gpt-5-nano',
    tools: [getWeatherTool, sendMail]
})

async function main(query = '') {
    const result = await run(agent, query)
    console.log(result.finalOutput)
}

main(`Send email to this',abhi199works@gmail.com', 'Meeting Reminder', 'This is a reminder for our meeting scheduled tomorrow at 10 AM. also if it fails inform me.`)