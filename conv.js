import {Agent, run, tool} from '@openai/agents'
import { config } from 'dotenv'
import { z } from 'zod'

config();

let sharedHistory = []; 

const executeSql = tool({
    name: 'execute_sql',
    description: 'This executes the Sql query',
    parameters: z.object({
        sql: z.string().describe('the sql query')
    }),
    execute: async ({sql}) => {
        console.log(`SQL executed: ${sql}`)
        return 'done'
    }
})

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
    tools: [executeSql],
    model: 'gpt-5-nano'
})

// async function main(q) {
//     sharedHistory = sharedHistory.concat({role: 'user', content: q ?? ''})
//     const result = await run(sqlAgent, sharedHistory)
//     sharedHistory = sharedHistory.concat(result.history)
//     console.log(result.finalOutput)
// }

async function main(q) {
    sharedHistory.push({role: 'user', content: q ?? ''})
    const result = await run(sqlAgent, sharedHistory)
    sharedHistory = result.history
    console.log(result.finalOutput)
}

//Turn 1
main('Give me all users and my name is Abhi').then(()=> {
    //Turn 2
    main('Give me all users same as my name')
})