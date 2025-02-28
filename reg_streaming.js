import 'dotenv/config';
import OpenAI from "openai";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    // Step 1: Create an Assistant
    const assistant = await openai.beta.assistants.create({
      name: "Customer Support",
      instructions: "You are a customer support agent.",
      tools: [{ type: "code_interpreter" }],
      model: "gpt-4-0613", // Ensure this is a valid model you have access to
    });

    console.log('Assistant created:', assistant);

    // Step 2: Create a Thread
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread);

    // Step 3: Add a Message to the Thread
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "What are the services you offer?",
    });
    console.log('Message added:', message);

    // Step 4: Create and Stream a Run
    openai.beta.threads.runs.stream(thread.id, {
      assistant_id: assistant.id,
    })
      .on('textCreated', (text) => {
        process.stdout.write('\nassistant > ');
      })
      .on('textDelta', (textDelta, snapshot) => {
        process.stdout.write(textDelta.value);
      })
      .on('toolCallCreated', (toolCall) => {
        process.stdout.write(`\nassistant > ${toolCall.type}\n\n`);
      })
      .on('toolCallDelta', (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === 'code_interpreter') {
          if (toolCallDelta.code_interpreter.input) {
            process.stdout.write(toolCallDelta.code_interpreter.input);
          }
          if (toolCallDelta.code_interpreter.outputs) {
            process.stdout.write("\noutput >\n");
            toolCallDelta.code_interpreter.outputs.forEach(output => {
              if (output.type === "logs") {
                process.stdout.write(`\n${output.logs}\n`);
              }
            });
          }
        }
      })
      .on('end', () => {
        console.log('\nRun completed.');
      })
      .on('error', (error) => {
        console.error('Error during streaming:', error);
      });

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
