import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "./utils/retriever.js";
import { combineDocuments } from "./utils/combineDocuments.js";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
process.loadEnvFile(); // Load environment variables from .env file

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", 
  temperature: 0,
  maxRetries: 2,
  apiKey: process.env.GOOGLE_API_KEY,
  apiVersion: "v1",
});

// A string holding the phrasing of the prompt
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:'

// A prompt created using PromptTemplate and the fromTemplate method
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Rashmika based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email rashmikamadaelaofficial@gmail.com. Don't try to make up an answer. Always speak as if you were a friendly assistant helping the recruiters who asks questions about Rashmika to hire him.
context: {context}
question: {question}
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
        question: ({original_input})=> original_input.question
    },
    answerChain
])

// Await the response when you INVOKE the chain. 
// Remember to pass in a question.
const response = await chain.invoke({
    question: 'Has he worked on any open source projects?'
})

console.log(response)

async function progressConversation() {
    const userInput = document.getElementById('user-input')
    const chatbotConversation = document.getElementById('chatbot-conversation-container')
    const question = userInput.value
    userInput.value = ''

    // add human message
    const newHumanSpeechBubble = document.createElement('div')
    newHumanSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newHumanSpeechBubble)
    newHumanSpeechBubble.textContent = question
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight

    // add AI message
    const newAiSpeechBubble = document.createElement('div')
    newAiSpeechBubble.classList.add('speech', 'speech-ai')
    chatbotConversation.appendChild(newAiSpeechBubble)
    newAiSpeechBubble.textContent = result
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
}