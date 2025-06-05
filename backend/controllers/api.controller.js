import { makeGeminiRequest } from "../utils/geminiService.js";

async function getEmbed(req, res){
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
}

async function getChat(req, res) {
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
}; 

export { getEmbed, getChat };