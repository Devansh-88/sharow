import env from "@/config/env";
import { GoogleGenAI } from "@google/genai";


async function main() {
  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  const imageUrl = "https://www.mamp.one/wp-content/uploads/2024/09/image-resources2.jpg";

  const response = await fetch(imageUrl);
  const imageArrayBuffer = await response.arrayBuffer();
  const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');
  
  // Detect MIME type from Content-Type header
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/png';

  const result = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [
    {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    },
    { text: "Caption this image." }
  ],
  });
  for await (const chunk of result) {
    console.log(chunk.text);
  }
}

main();