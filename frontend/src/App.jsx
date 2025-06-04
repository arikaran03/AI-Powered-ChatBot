// src/App.jsx
import React, { useState, useEffect } from 'react';
import './conponents/Style.css'; // Import your CSS styles
import FileUploader from './conponents/FileUploader';
import ChatInterface from './conponents/ChatInterface';

import {
  extractTextFromPdf,
  extractTextFromDocx,
  extractTextFromImage, // You'll need to handle this more robustly
  getTextChunks
} from './services/textExtractor';


import { getEmbeddings, getAnswerFromContext } from './services/geminiService'; // Or your proxy versions

// Simple cosine similarity (move to a utils file if needed)
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0; // Avoid division by zero
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


function App() {
  const [rawText, setRawText] = useState('');
  const [processedChunksWithEmbeddings, setProcessedChunksWithEmbeddings] = useState([]); // Stores { chunk: string, embedding: number[] }
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingSuccess, setProcessingSuccess] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const handleFileProcessing = async (files) => {
    setIsProcessingFiles(true);
    setProcessingSuccess(false);
    setRawText('');
    setProcessedChunksWithEmbeddings([]);
    setChatHistory([]); // Reset chat
    setErrorMessage('');

    let combinedText = "";
    try {
      for (const file of files) {
        let text = "";
        if (file.type === "application/pdf") {
          text = await extractTextFromPdf(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "application/msword") {
          text = await extractTextFromDocx(file);
        } else if (file.type.startsWith("image/")) {
           try {
            text = await extractTextFromImage(file); // Handle potential rejection
          } catch (ocrError) {
            console.error("OCR Error:", ocrError);
            setErrorMessage(`Could not process image ${file.name}: ${ocrError.message || ocrError}`);
            // Continue with other files if any
          }
        } else if (file.type === "text/plain") {
            text = await file.text();
        } else {
          console.warn(`Unsupported file type: ${file.name} (${file.type})`);
          setErrorMessage(prev => prev + `\nUnsupported file type: ${file.name}. Skipped.`);
        }
        combinedText += text + "\n\n"; // Add separators
      }

      setRawText(combinedText);
      const chunks = getTextChunks(combinedText);

      if (chunks.length > 0) {
        const chunksWithEmbeddings = await getEmbeddings(chunks); // This calls Gemini
        setProcessedChunksWithEmbeddings(chunksWithEmbeddings);
        setProcessingSuccess(true);
        setTimeout(() => setProcessingSuccess(false), 3000); // Hide success message after 3s
      } else if (!combinedText.trim() && !errorMessage) {
        setErrorMessage("No text could be extracted from the provided files.");
      } else if (!combinedText.trim() && errorMessage && files.length > 0) {
        // Error message already set for unsupported/failed files
      } else if (files.length > 0 && combinedText.trim() === "") {
         setErrorMessage("Files processed, but no text content found to create embeddings.");
      }

    } catch (error) {
      console.error("Error processing files:", error);
      setErrorMessage(`Processing error: ${error.message}`);
      setProcessingSuccess(false);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleAskQuestion = async (question) => {
    if (!question || processedChunksWithEmbeddings.length === 0) return;

    setIsLoadingAnswer(true);
    setErrorMessage('');
    const currentChatHistory = [...chatHistory, { sender: 'user', text: question }];
    setChatHistory(currentChatHistory);

    try {
      // 1. Get embedding for the question
      const questionEmbeddingResponse = await getEmbeddings([question]); // Re-use getEmbeddings
      if (!questionEmbeddingResponse || questionEmbeddingResponse.length === 0 || !questionEmbeddingResponse[0].embedding) {
        throw new Error("Could not get embedding for the question.");
      }
      const questionEmbedding = questionEmbeddingResponse[0].embedding;

      // 2. Find relevant chunks (simple similarity search)
      const rankedChunks = processedChunksWithEmbeddings
        .map(chunkData => ({
          ...chunkData,
          similarity: cosineSimilarity(questionEmbedding, chunkData.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity);

      // 3. Create context (e.g., top 3 chunks)
      const topK = 3;
      const contextChunks = rankedChunks.slice(0, topK).filter(c => c.similarity > 0.5); // Add a similarity threshold
      
      let context = "";
      if (contextChunks.length > 0) {
          context = contextChunks.map(c => c.chunk).join("\n---\n"); // Join chunks with a separator
      } else {
          context = "No relevant information found in the documents for this question.";
      }


      // 4. Get answer from Gemini
      const answer = await getAnswerFromContext(context, question);
      setChatHistory([...currentChatHistory, { sender: 'ai', text: answer }]);

    } catch (error) {
      console.error("Error getting answer:", error);
      setErrorMessage(`Error answering question: ${error.message}`);
      setChatHistory([...currentChatHistory, { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };


  return (
    <div className="app-container">
      <header className="header">Chat with Your Documents 📄🤖 <span className="emoji">💁</span></header>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <FileUploader
        onProcess={handleFileProcessing}
        processing={isProcessingFiles}
        processingSuccess={processingSuccess}
      />
      <ChatInterface
        onAskQuestion={handleAskQuestion}
        chatHistory={chatHistory}
        isReady={processedChunksWithEmbeddings.length > 0 && !isProcessingFiles}
        isLoadingAnswer={isLoadingAnswer}
      />
    </div>
  );
}

export default App;