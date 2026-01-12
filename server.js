import express from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "./utils/retriever.js";
import { combineDocuments } from "./utils/combineDocuments.js";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { formatConvHistory } from "./utils/fotmatConvHistory.js";

try {
    // Try loading the file (for local development)
    process.loadEnvFile();
} catch (error) {
    // If file is missing, ignore it (Docker/Cloud handles the variables)
    console.log("No .env file found, assuming environment variables are injected.");
}

const app = express();
app.use(express.json());

// 1. Serve your HTML/CSS frontend
app.use(express.static("public"));

// 2. Setup LLM and prompt
const llm = new ChatGoogleGenerativeAI({
  model: "gemma-3-27b-it", 
  temperature: 0,
  maxRetries: 2,
  apiKey: process.env.GOOGLE_API_KEY,
});

// A string holding the phrasing of the prompt
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:'

// A prompt created using PromptTemplate and the fromTemplate method
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Rashmika based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email rashmikamadaelaofficial@gmail.com. Don't try to make up an answer. Always speak as if you were a friendly assistant helping the recruiters who asks questions about Rashmika to hire him.
context: {context}
question: {question}
conversation history:{conversation_history}
answer:
`

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

const standaloneChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser())
const retriverChain = RunnableSequence.from([
    prevResult => prevResult.standaloneQuestion,
    retriever,
    combineDocuments
])
const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())


// Take the standaloneQuestionPrompt and PIPE the model
const chain = RunnableSequence.from([
    {
        standaloneQuestion: standaloneChain,
        original_input: new RunnablePassthrough()

    },
    {
        context: retriverChain,
        question: ({original_input})=> original_input.question,
        conversation_history: ({original_input})=> original_input.conv_history
    },
    answerChain
])

app.post("/chat", async (req, res) => {
  try {
    const response = await chain.invoke({
        question: req.body.question,
        conv_history: formatConvHistory(req.body.conv_history)
    })
    
    // Send just the text back to the browser
    res.json({ reply: response });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Start
app.listen(3000, () => console.log("Server running at http://localhost:3000"));