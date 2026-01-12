import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from '@supabase/supabase-js';

try {
    // Try loading the file (for local development)
    process.loadEnvFile();
} catch (error) {
    // If file is missing, ignore it (Docker/Cloud handles the variables)
    console.log("No .env file found, assuming environment variables are injected.");
}

const sbApiKey = process.env.SUPABASE_API_KEY
const dbUrl = process.env.DATABASE_URL
const googleApiKey = process.env.GOOGLE_API_KEY
const embeddings = new GoogleGenerativeAIEmbeddings({model: "text-embedding-004"});

const client = createClient(dbUrl, sbApiKey)
const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'documents',
    queryName: 'match_documents'
});

const retriever = vectorStore.asRetriever();

export { retriever };