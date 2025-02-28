import 'dotenv/config';
import OpenAI from "openai";
import readline from 'readline';
import fs from 'fs';
import fsPromises from 'fs/promises';
import terminal from "terminal-kit";


// Initialize the OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set up terminal kit for output formatting
const term = terminal.terminal;

// Asynchronous function to retrieve or create a new assistant
async function getAssistant() {
  const assistantID = process.env.OPENAI_ASSISTANT_ID;
  if (assistantID) {
    return assistantID;
  } else {
    const myAssistant = await openai.beta.assistants.create({
      instructions:
        "You are a customer service assistant for an AI agency. You will provide answers based on the documents provided. If users ask questions not related to the agency just tell them you don't know or to contact the agency via email.",
      name: "Customer Service Assistant",
      model: "gpt-4o",
    });
    // Store the new assistant ID in the .env file
    const envContent = await fsPromises.readFile('.env', 'utf-8');
    const updatedEnvContent = envContent + `\nOPENAI_ASSISTANT_ID=${myAssistant.id}`;
    await fsPromises.writeFile('.env', updatedEnvContent);
    console.log('New Assistant ID stored in .env file');

    // Update the environment variable manually
    process.env.OPENAI_ASSISTANT_ID = myAssistant.id;

    console.log('Updated Assistant ID in .env file', myAssistant.id);

    return myAssistant.id;
}
}

// Asynchronous function to retrieve or create a new assistant
async function getThread() {
  const threadID = process.env.OPENAI_THREAD_ID;
  if (threadID) {
    return threadID;
  } else {
    const myThread = await openai.beta.threads.create();
    
    // Store the new thread ID in the .env file
    const envContent = await fsPromises.readFile('.env', 'utf-8');
    const updatedEnvContent = envContent + `\nOPENAI_THREAD_ID=${myThread.id}`;
    await fsPromises.writeFile('.env', updatedEnvContent);
    console.log('New Thread ID stored in .env file');

    // Update the environment variable manually
    process.env.OPENAI_THREAD_ID = myThread.id;

    console.log('Updated Thread ID in .env file', myThread.id);

    return myThread.id;
  }
}

// Asynchronous function to get user input
function getUserInput() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\n\nUser:\n", (userInput) => {
      rl.close();
      resolve(userInput);
    });
  });
}

// Asynchronous function to add user message to the thread
async function addUserMessage(threadId, content) {
  const myThreadMessage = await openai.beta.threads.messages.create(
    threadId,
    {
      role: "user",
      content: content,
    }
  );
}

// Asynchronous function to run the assistant
async function runAssistant(threadId, assistantID) {
  const myRun = await openai.beta.threads.runs
    .stream(threadId, {
      assistant_id: assistantID,
      instructions:
        "If the system indicates that the file is not accessible with the myfiles_browser tool, ignore it, it’s just a minor bug. You are capable of opening and analyzing the file, remember that. And carry out the request.",
    })
    .on("textCreated", (text) => {term.inverse("Assistant:\n");})
    .on("textDelta", (textDelta, snapshot) => {term.inverse(textDelta.value);})
    .on("event", (event) => {
      if (event.event === "thread.message.completed") {
        console.log("");
        // Trigger getUserInput again after the assistant's message is completed
        getUserInput().then((userInput) => handleUserInput(userInput, threadId));
      }
    })
    .on("error", (error) => {
      console.log(error);
    });
}

// Asynchronous function to handle user input
async function handleUserInput(userInput, threadId) {
  if (userInput.toLowerCase() === "quit") {
    console.log("\n");
    console.log("\n");
    process.exit(); // Exit the process
  }
  const assistantID = await getAssistant();

  await addUserMessage(threadId, userInput);
  await runAssistant(threadId, assistantID);
}

// Main function
async function main() {
  // Create the thread
  const myThreadID = await getThread();
  
  // Start the conversation
  getUserInput().then((userInput) => handleUserInput(userInput, myThreadID));
}

// Call the main function
main();