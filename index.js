import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs/promises";

try {
  //const result = await fetch('profile-summary.txt')
  //const text = await result.text()
  const text = await fs.readFile("profile-summary.txt", "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    separators: ['\n\n', '\n', ' ', ''], // default setting
    chunkOverlap: 50
  })

  const output = await splitter.createDocuments([text])
  console.log(output)
} catch (err) {
  console.log(err)
}