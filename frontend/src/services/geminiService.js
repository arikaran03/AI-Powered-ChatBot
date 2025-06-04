// src/services/geminiService.js

// IMPORTANT: Using the API key directly in the frontend is a MAJOR security risk.
// This is for DEMONSTRATION / LOCAL DEVELOPMENT ONLY.
// In production, these calls MUST be made from a backend server where the API key is secure.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // For Vite
// const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; // For CRA

const EMBEDDING_MODEL = "models/embedding-001";
const GENERATION_MODEL = "gemini-pro"; // Or your preferred Gemini model

// ---- OPTION 1: DIRECT API CALL (NOT FOR PRODUCTION) ----
async function callGeminiApi(endpoint, payload) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API request failed: ${errorData.error?.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function getEmbeddings(textChunks) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found. Set VITE_GEMINI_API_KEY in your .env file.");
  }
  // Gemini API for embeddings expects a slightly different structure for batch requests
  // It's often one request per document or content part.
  // Here, we'll do it one by one for simplicity, but batching is better if API supports it well.
  const embeddings = [];
  for (const chunk of textChunks) {
    const response = await callGeminiApi(`${EMBEDDING_MODEL}:embedContent`, {
      content: { parts: [{ text: chunk }] }
    });
    if (response.embedding && response.embedding.values) {
      embeddings.push({ chunk: chunk, embedding: response.embedding.values });
    } else {
      console.warn("No embedding found for chunk:", chunk, "Response:", response);
      embeddings.push({ chunk: chunk, embedding: [] }); // Or handle error appropriately
    }
  }
  return embeddings; // Returns array of { chunk: string, embedding: number[] }
}


export async function getAnswerFromContext(context, question) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found. Set VITE_GEMINI_API_KEY in your .env file.");
  }

  const prompt = `
    Answer the question as detailed as possible from the provided context, make sure to provide all the details.
    If the answer is not in the provided context, just say, "The answer is not available in the provided documents."
    Do not provide a wrong answer.

    Context:
    ${context}

    Question:
    ${question}

    Answer:
  `;

  const response = await callGeminiApi(`${GENERATION_MODEL}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3, // Adjust as needed
      // maxOutputTokens: 2048, // Adjust as needed
    }
  });

  if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts.length > 0) {
    return response.candidates[0].content.parts[0].text;
  } else {
    console.error("No valid response from Gemini chat:", response);
    return "Sorry, I couldn't get a response. Please check the console for errors.";
  }
}


// ---- OPTION 2: CALLING YOUR OWN BACKEND PROXY (RECOMMENDED FOR PRODUCTION) ----
// const BACKEND_API_URL = import.meta.env.VITE_REACT_APP_BACKEND_API_URL || "http://localhost:3001/api/gemini";

// export async function getEmbeddingsWithProxy(textChunks) {
//   const response = await fetch(`${BACKEND_API_URL}/embed`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ texts: textChunks }),
//   });
//   if (!response.ok) throw new Error('Failed to get embeddings via proxy');
//   const data = await response.json();
//   // Assuming backend returns embeddings in a format compatible with your client-side needs
//   // e.g., [{ chunk: string, embedding: number[] }, ...]
//   return textChunks.map((chunk, index) => ({ chunk, embedding: data.embeddings[index] }));
// }

// export async function getAnswerFromContextWithProxy(context, question) {
//   const response = await fetch(`${BACKEND_API_URL}/chat`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ context, question }),
//   });
//   if (!response.ok) throw new Error('Failed to get answer via proxy');
//   const data = await response.json();
//   return data.answer;
// }