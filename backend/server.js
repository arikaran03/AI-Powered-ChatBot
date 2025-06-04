// my-chat-pdf-backend/server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // Using node-fetch v2 for CommonJS
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GOOGLE_API_KEY is not defined in the backend .env file.");
    process.exit(1); // Exit if API key is missing
}

// Configure CORS: Allow requests from your React app's origin
const corsOptions = {
  origin: 'http://localhost:5173', // Default Vite frontend URL
  // origin: 'http://localhost:3000', // If using Create React App, change this
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON request bodies

// Centralized function to make requests to Gemini API
async function makeGeminiRequest(modelIdentifier, payload) { // Renamed modelEndpoint to modelIdentifier for clarity
    // modelIdentifier will be like "embedding-001:embedContent" or "gemini-pro:generateContent"
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelIdentifier}?key=${GEMINI_API_KEY}`;
    
    console.log(`Backend: Making request to Gemini: ${API_URL}`);
    // For more detailed debugging, you can uncomment the payload logging:
    // console.log(`Backend: Payload for ${modelIdentifier}: ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let responseData;

        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error(`Backend Gemini API Error: Could not parse JSON response. Status: ${response.status}. Response Text: ${responseText}`);
            throw { 
                status: response.status, 
                message: 'Gemini API returned non-JSON response', 
                details: responseText 
            };
        }

        if (!response.ok) {
            console.error(`Backend Gemini API Error (${response.status}):`, responseData);
            throw { 
                status: response.status, 
                message: responseData.error?.message || `Gemini API request failed with status ${response.status}`,
                details: responseData.error?.details || responseData
            };
        }
        // console.log(`Backend: Gemini API success response for ${modelIdentifier}:`, responseData); // Uncomment for detailed success logging
        return responseData;
    } catch (error) {
        console.error(`Backend: Error in makeGeminiRequest for ${modelIdentifier}:`, error);
        if (error.status) throw error;
        throw { status: 500, message: 'Internal server error while contacting Gemini API', details: error.message };
    }
}

// Endpoint to get embeddings
app.post('/api/gemini/embed', async (req, res) => {
    const { texts } = req.body;
    console.log("Backend /api/gemini/embed received request for texts count:", texts ? texts.length : 0);

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Invalid request: "texts" must be a non-empty array.' });
    }

    try {
        const embeddings = [];
        for (const text of texts) {
            if (!text || !text.trim()) {
                console.warn("Backend /api/gemini/embed: Skipping empty or whitespace-only text chunk for embedding.");
                embeddings.push([]);
                continue;
            }
            // CORRECTED: Pass only the model name and action, not "models/" prefix
            const response = await makeGeminiRequest(`embedding-001:embedContent`, {
                content: { parts: [{ text: text.trim() }] }
            });
            embeddings.push(response.embedding?.values || []);
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
    console.log("Backend /api/gemini/chat received request for question:", question);

    if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Invalid request: "question" is required and cannot be empty.' });
    }

    const prompt = `
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
    provided context just say, "answer is not available in the context", don't provide the wrong answer.

    Context:
    ${context || "No context provided."}

    Question:
    ${question.trim()}

    Answer:
    `;

    try {
        // CHANGE YOUR GEMINI MODEL VERSION HERE 


        // Pass the model name and action for generation
        // const response = await makeGeminiRequest(`gemini-pro:generateContent`, { // Or your preferred model like "gemini-1.5-flash-latest:generateContent"
        //     contents: [{ parts: [{ text: prompt }] }],
        //     generationConfig: {
        //         temperature: 0.3,
        //     }
        // });
        // CORRECTED: Using a more current and likely available model identifier for v1beta


        const response = await makeGeminiRequest(`gemini-1.5-flash-latest:generateContent`, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
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