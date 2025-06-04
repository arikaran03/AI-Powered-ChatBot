// my-chat-pdf-backend/server.js
require('dotenv').config(); // Loads variables from .env file into process.env
const express = require('express');
const fetch = require('node-fetch'); // Or use global.fetch if Node.js 18+
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY; // Securely loaded from backend .env

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GOOGLE_API_KEY is not defined in the backend .env file.");
    process.exit(1); // Exit if API key is missing
}

// Configure CORS: Allow requests from your React app's origin
const corsOptions = {
  origin: 'http://localhost:5173', // Your React app's development URL (Vite default)
  // origin: 'http://localhost:3000', // Your React app's development URL (CRA default)
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON request bodies

// Centralized function to make requests to Gemini API
async function makeGeminiRequest(modelEndpoint, payload) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}?key=${GEMINI_API_KEY}`;
    
    console.log(`Backend: Making request to Gemini: ${API_URL}`);
    console.log(`Backend: Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json(); // Try to parse JSON regardless of status for debugging

        if (!response.ok) {
            console.error(`Backend Gemini API Error (${response.status}):`, responseData);
            // Ensure a structured error is thrown
            throw { 
                status: response.status, 
                message: responseData.error?.message || `Gemini API request failed with status ${response.status}` ,
                details: responseData.error?.details
            };
        }
        console.log("Backend: Gemini API success response:", responseData);
        return responseData;
    } catch (error) {
        console.error("Backend: Error in makeGeminiRequest:", error);
        // If it's already a structured error from above, rethrow it
        if (error.status) throw error;
        // Otherwise, wrap it
        throw { status: 500, message: 'Internal server error while contacting Gemini API', details: error.message };
    }
}

// Endpoint to get embeddings
app.post('/api/gemini/embed', async (req, res) => {
    const { texts } = req.body; // Expects an array of texts
    console.log("Backend /api/gemini/embed received texts:", texts);

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Invalid request: "texts" must be a non-empty array.' });
    }

    try {
        const embeddings = [];
        // Gemini embedContents often processes one document/content part at a time in the request structure.
        // For multiple chunks, you might make multiple requests or structure as a batch if supported by the specific model.
        // For simplicity, here's one by one:
        for (const text of texts) {
            const response = await makeGeminiRequest(`models/embedding-001:embedContent`, {
                content: { parts: [{ text }] }
            });
            embeddings.push(response.embedding?.values || []); // Ensure to push even if empty, or handle error
        }
        res.json({ embeddings });
    } catch (error) {
        console.error("Backend /api/gemini/embed error:", error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to get embeddings', details: error.details });
    }
});

// Endpoint for chat/QA
app.post('/api/gemini/chat', async (req, res) => {
    const { context, question } = req.body;
    console.log("Backend /api/gemini/chat received context/question");

    if (!question) {
        return res.status(400).json({ error: 'Invalid request: "question" is required.' });
    }

    // Using the prompt structure from your Python code
    const prompt = `
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
    provided context just say, "answer is not available in the context", don't provide the wrong answer

    Context:
    ${context || "No context provided."}? 
    Question: 
    ${question}

    Answer:
    `;

    try {
        const response = await makeGeminiRequest(`gemini-pro:generateContent`, { // Or your preferred model e.g., gemini-1.5-flash-latest
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                // maxOutputTokens: 2048, // Optional: configure as needed
            }
        });
        
        const answer = response.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't formulate a response based on the provided information.";
        res.json({ answer });
    } catch (error) {
        console.error("Backend /api/gemini/chat error:", error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to get chat response', details: error.details });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend proxy server running on http://localhost:${PORT}`);
    console.log(`🔑 GOOGLE_API_KEY loaded: ${GEMINI_API_KEY ? 'Yes' : 'NO! CHECK .env FILE!'}`);
    console.log(`📡 Allowing requests from: ${corsOptions.origin}`);
});