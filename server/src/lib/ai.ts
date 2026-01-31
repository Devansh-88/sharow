import env from "@/config/env";
import { GoogleGenAI , createUserContent , createPartFromUri } from "@google/genai";


// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

async function main() {
  const myfile = await ai.files.upload({
    file: ".././temp/image.png",
    config: { mimeType: "image/png" },
  });
  if(!myfile)
  {
    console.error("Failed to upload file");
    return;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: createUserContent  ([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Caption this image.",
    ]),
  });
  console.log(response.text);
}


main();