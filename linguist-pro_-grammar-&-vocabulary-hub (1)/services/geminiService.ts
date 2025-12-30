import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordDefinition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function lookupWord(word: string, mode: 'EN' | 'CN' = 'EN'): Promise<WordDefinition> {
  const systemPrompt = mode === 'CN' 
    ? `You are an elite bilingual English-Chinese linguistic mentor. The user provides a CHINESE word or phrase. 
       1. Identify the most accurate, natural, and contemporary English translation(s).
       2. Perform a deep linguistic and grammatical analysis on the chosen English expression.
       3. Provide the result in the requested JSON format.
       4. The "grammarNotes" MUST be a detailed pedagogical explanation in Chinese. Explain 'why' and 'how' to use the word, common pitfalls for Chinese learners, and cultural nuances. Speak directly to the student.`
    : `You are an elite English grammar and vocabulary mentor. The user provides an ENGLISH word or phrase.
       1. Analyze the word's primary meaning, grammatical properties, and core usage patterns.
       2. Provide natural, context-aware Chinese translations.
       3. Provide the result in the requested JSON format.
       4. The "grammarNotes" MUST be a detailed explanation in Chinese focusing on sentence structure, tense usage, and natural collocations.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${systemPrompt}\n\nUser Input: "${word}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The primary English word or phrase analyzed" },
          phonetic: { type: Type.STRING, description: "IPA pronunciation guide" },
          partOfSpeech: { type: Type.STRING },
          definition: { type: Type.STRING, description: "Professional English definition" },
          chineseTranslation: { type: Type.STRING, description: "The most fitting Chinese translation" },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING, description: "Natural English example sentence" },
                cn: { type: Type.STRING, description: "Accurate Chinese translation" }
              },
              required: ["en", "cn"]
            }
          },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          grammarNotes: { type: Type.STRING, description: "Deep pedagogical explanation written in friendly Chinese" }
        },
        required: ["word", "phonetic", "partOfSpeech", "definition", "chineseTranslation", "examples", "grammarNotes"]
      }
    }
  });

  try {
    const text = response.text.trim();
    // Handling potential markdown formatting in JSON response
    const jsonStr = text.startsWith('```json') ? text.replace(/```json|```/g, '') : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Invalid response format from AI mentor. Please try a different query.");
  }
}

export async function generateAudio(text: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `You are a helpful language teacher. Read the following text naturally and clearly, pausing briefly between English and Chinese sections: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Kore' is chosen for its clear bilingual capabilities.
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation failed", error);
    return undefined;
  }
}
