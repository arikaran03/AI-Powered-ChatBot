import apiRoutes from "./routes/api.route.js";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS: Allow requests from your React app's origin
const corsOptions = {
  origin: 'http://localhost:5173', // Default Vite frontend URL
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON request bodies

app.use("/api/gemini", apiRoutes); // Endpoint to get embeddings and  chat responses

app.listen(PORT, () => {
    console.log(`✅ Backend proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Allowing requests from: ${corsOptions.origin}`);
});