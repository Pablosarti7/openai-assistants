import 'dotenv/config';
import OpenAI from "openai";
import { businessInfoFunctions, get_services, get_pricing, get_business_hours, get_location } from './businessinfo.js';


const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    const assistant = await client.beta.assistants.create({
        name: "Customer Assistant",
        model: "gpt-4o",
        instructions:
            "Your name is Feid. You are a business information bot. Use the provided functions to answer questions.",
        tools: businessInfoFunctions,
    });

    console.log(`Assistant ID: ${assistant.id}`);

    const thread = await client.beta.threads.create();

    console.log(`Thread ID: ${thread.id}`);

    const message = await client.beta.threads.messages.create(thread.id, {
        role: "user",
        content: "tell me a long story?",
    });

    console.log(`Message ID: ${message.id}`);

    const handleRequiresAction = async (run) => {
        if (
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            
            const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
                (tool) => {
                    if (tool.function.name === "get_services") {
                        return {
                            tool_call_id: tool.id,
                            output: JSON.stringify(get_services()),
                        };
                    } else if (tool.function.name === "get_pricing") {
                        return {
                            tool_call_id: tool.id,
                            output: JSON.stringify(get_pricing()),
                        };
                    } else if (tool.function.name === "get_business_hours") {
                        return {
                            tool_call_id: tool.id,
                            output: JSON.stringify(get_business_hours()),
                        };
                    } else if (tool.function.name === "get_location") {
                        return {
                            tool_call_id: tool.id,
                            output: JSON.stringify(get_location()),
                        };
                    }
                }
            );
            

            // Submit all tool outputs at once after collecting them in a list
            if (toolOutputs.length > 0) {
                run = await client.beta.threads.runs.submitToolOutputsAndPoll(
                    thread.id,
                    run.id,
                    {
                        tool_outputs: toolOutputs,
                    },
                );
                console.log("Tool outputs submitted successfully.");
            } else {
                console.log("No tool outputs to submit.");
            }

            // Check status after submitting tool outputs
            return await handleRunStatus(run);
        }
    };

    async function handleRunStatus(run) {
        if (run.status === "completed") {
            let messagesResponse = await client.beta.threads.messages.list(thread.id);
            let messages = messagesResponse.data;

            // Filter out assistant messages
            const assistantMessages = messages.filter(
                (message) => message.role === "assistant"
            );

            if (assistantMessages.length === 0) {
                console.log("No assistant messages found.");
                return;
            }

            // Get the last assistant message
            const lastAssistantMessage =
                assistantMessages[assistantMessages.length - 1];

            // Extract the text content from the message
            let assistantResponse = "";
            for (const contentBlock of lastAssistantMessage.content) {
                if (contentBlock.type === "text" && contentBlock.text.value) {
                    assistantResponse += contentBlock.text.value;
                }
            }

            // Log the assistant's response
            console.log("Assistant response:", assistantResponse);

            return messages;
        } else if (run.status === "requires_action") {
            console.log("Run requires action.");
            return await handleRequiresAction(run);
        } else {
            console.error("Run did not complete:", run);
        }
    }

    // Create and poll run
    let run = await client.beta.threads.runs.createAndPoll(thread.id,
        { assistant_id: assistant.id },
    );

    console.log(`Run ID: ${run.id}`);

    await handleRunStatus(run);
}

main();