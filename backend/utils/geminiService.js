import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Also add this import (see problem 2)

dotenv.config(); // Load .env variables for this module
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GOOGLE_API_KEY is not available in geminiservice.js.");
}


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

export { makeGeminiRequest };