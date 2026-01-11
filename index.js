import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from '@supabase/supabase-js';
import fs from "fs/promises";
process.loadEnvFile(); // Load environment variables from .env file

try {

    const sbApiKey = process.env.SUPABASE_API_KEY
    const dbUrl = process.env.DATABASE_URL
    const googleApiKey = process.env.GOOGLE_API_KEY

    //const result = await fetch('profile-summary.txt')
    //const text = await result.text()
    const text = await fs.readFile("profile-summary.txt", "utf-8");

    const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    separators: ["###", "\n\n", "\n", " "], // default setting
    chunkOverlap: 200
    })

    const client = createClient(dbUrl, sbApiKey)

    const output = await splitter.createDocuments([text])
    //console.log(output)

    await SupabaseVectorStore.fromDocuments(
        output,
        new GoogleGenerativeAIEmbeddings({model: "text-embedding-004"}),
        {
            client,
            tableName: 'documents',
        }
    )
    console.log("Data uploaded successfully!")
} catch (err) {
    console.log(err)
}