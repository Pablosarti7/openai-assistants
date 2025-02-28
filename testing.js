import 'dotenv/config';
import OpenAI from "openai";
import readline from 'readline';
import fs from 'fs';
import fsPromises from 'fs/promises';

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create a readline interface for user input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt the user with a question and return a Promise with the answer
function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function getOrCreateAssistant(openai) {
    try {
        const data = await fsPromises.readFile('assistant_data.json', 'utf8');
        const { assistantId } = JSON.parse(data);
        console.log('Using existing Assistant:', assistantId);
        return { id: assistantId };
    } catch (error) {

        // Assistant file path
        const assistantFilePath = "assistant.json";
        // check if file doesn't exist
        if (!fs.existsSync(assistantFilePath)) {
            // Create a file
            const file = await openai.files.create({
                file: fs.createReadStream("Knowledgebase.docx"),
                purpose: "assistants",
            });
            // Create a vector store including our file
            let vectorStore = await openai.beta.vectorStores.create({
                name: "Frequentl Asked Questions",
                file_ids: [file.id],
            });
            // Create assistant
            const assistant = await openai.beta.assistants.create({
                name: "Customer Support Assistant",
                instructions: `You are a customer support agent for a web development agency. You only answer questions about the agency. Any other questions not related to the agency just say you don't know.`,
                tools: [{ type: "file_search" }],
                tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
                model: "gpt-4o",
            });
            await fsPromises.writeFile('assistant_data.json', JSON.stringify({ assistantId: assistant.id }));
            console.log('New Assistant created:', assistant.id);
            // Write assistant to file
            fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
            return assistant;
        } else {
            // Read assistant from file
            const assistant = JSON.parse(fs.readFileSync(assistantFilePath));
            return assistant;
        }

    }
}

async function getOrCreateThread(openai) {
    try {
        const data = await fsPromises.readFile('thread_data.json', 'utf8');
        const { threadId } = JSON.parse(data);
        console.log('Using existing Thread:', threadId);
        return { id: threadId };
    } catch (error) {
        // If file doesn't exist or is invalid, create a new thread
        const thread = await openai.beta.threads.create();
        await fsPromises.writeFile('thread_data.json', JSON.stringify({ threadId: thread.id }));
        console.log('New Thread created:', thread.id);
        return thread;
    }
}

async function main() {
    try {
        const assistant = await getOrCreateAssistant(openai);
        const thread = await getOrCreateThread(openai);

        while (true) {
            const userInput = await askQuestion("You: ");
            if (userInput.toLowerCase() === 'exit') {
                break;
            }

            await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: userInput,
            });

            // Create and start the run
            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: assistant.id,
            });

            // const stream = openai.beta.threads.runs
            // .stream(thread.id, {
            //     assistant_id: assistant.id,
            // })
            // .on("textCreated", () => console.log("assistant >"))

            // Poll for the run to complete
            let runStatus;
            do {
                runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
            } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

            if (runStatus.status === 'completed') {
                // Retrieve and display the messages
                const messages = await openai.beta.threads.messages.list(thread.id);
                const lastMessage = messages.data[0];
                if (lastMessage.role === 'assistant') {
                    console.log("Assistant >");
                    console.log(lastMessage.content[0].text.value);
                }
            } else {
                console.log("Run failed or was cancelled.");
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        rl.close();
    }
}

main();