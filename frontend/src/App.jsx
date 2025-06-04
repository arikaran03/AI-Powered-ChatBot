// // src/App.jsx
// import React, { useState, useEffect } from 'react';
// import './conponents/Style.css'; // Import your CSS styles
// import FileUploader from './conponents/FileUploader';
// import ChatInterface from './conponents/ChatInterface';

// import {
//   extractTextFromPdf,
//   extractTextFromDocx,
//   extractTextFromImage, // You'll need to handle this more robustly
//   getTextChunks
// } from './services/textExtractor';


// import { getEmbeddings, getAnswerFromContext } from './services/geminiService'; // Or your proxy versions

// // Simple cosine similarity (move to a utils file if needed)
// function cosineSimilarity(vecA, vecB) {
//   if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
//     return 0;
//   }
//   let dotProduct = 0;
//   let normA = 0;
//   let normB = 0;
//   for (let i = 0; i < vecA.length; i++) {
//     dotProduct += vecA[i] * vecB[i];
//     normA += vecA[i] * vecA[i];
//     normB += vecB[i] * vecB[i];
//   }
//   if (normA === 0 || normB === 0) return 0; // Avoid division by zero
//   return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
// }


// function App() {
//   const [rawText, setRawText] = useState('');
//   const [processedChunksWithEmbeddings, setProcessedChunksWithEmbeddings] = useState([]); // Stores { chunk: string, embedding: number[] }
//   const [chatHistory, setChatHistory] = useState([]);
//   const [isProcessingFiles, setIsProcessingFiles] = useState(false);
//   const [processingSuccess, setProcessingSuccess] = useState(false);
//   const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');


//   const handleFileProcessing = async (files) => {
//     setIsProcessingFiles(true);
//     setProcessingSuccess(false);
//     setRawText('');
//     setProcessedChunksWithEmbeddings([]);
//     setChatHistory([]); // Reset chat
//     setErrorMessage('');

//     let combinedText = "";
//     try {
//       for (const file of files) {
//         let text = "";
//         if (file.type === "application/pdf") {
//           text = await extractTextFromPdf(file);
//         } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "application/msword") {
//           text = await extractTextFromDocx(file);
//         } else if (file.type.startsWith("image/")) {
//            try {
//             text = await extractTextFromImage(file); // Handle potential rejection
//           } catch (ocrError) {
//             console.error("OCR Error:", ocrError);
//             setErrorMessage(`Could not process image ${file.name}: ${ocrError.message || ocrError}`);
//             // Continue with other files if any
//           }
//         } else if (file.type === "text/plain") {
//             text = await file.text();
//         } else {
//           console.warn(`Unsupported file type: ${file.name} (${file.type})`);
//           setErrorMessage(prev => prev + `\nUnsupported file type: ${file.name}. Skipped.`);
//         }
//         combinedText += text + "\n\n"; // Add separators
//       }

//       setRawText(combinedText);
//       const chunks = getTextChunks(combinedText);

//       if (chunks.length > 0) {
//         const chunksWithEmbeddings = await getEmbeddings(chunks); // This calls Gemini
//         setProcessedChunksWithEmbeddings(chunksWithEmbeddings);
//         setProcessingSuccess(true);
//         setTimeout(() => setProcessingSuccess(false), 3000); // Hide success message after 3s
//       } else if (!combinedText.trim() && !errorMessage) {
//         setErrorMessage("No text could be extracted from the provided files.");
//       } else if (!combinedText.trim() && errorMessage && files.length > 0) {
//         // Error message already set for unsupported/failed files
//       } else if (files.length > 0 && combinedText.trim() === "") {
//          setErrorMessage("Files processed, but no text content found to create embeddings.");
//       }

//     } catch (error) {
//       console.error("Error processing files:", error);
//       setErrorMessage(`Processing error: ${error.message}`);
//       setProcessingSuccess(false);
//     } finally {
//       setIsProcessingFiles(false);
//     }
//   };

//   const handleAskQuestion = async (question) => {
//     if (!question || processedChunksWithEmbeddings.length === 0) return;

//     setIsLoadingAnswer(true);
//     setErrorMessage('');
//     const currentChatHistory = [...chatHistory, { sender: 'user', text: question }];
//     setChatHistory(currentChatHistory);

//     try {
//       // 1. Get embedding for the question
//       const questionEmbeddingResponse = await getEmbeddings([question]); // Re-use getEmbeddings
//       if (!questionEmbeddingResponse || questionEmbeddingResponse.length === 0 || !questionEmbeddingResponse[0].embedding) {
//         throw new Error("Could not get embedding for the question.");
//       }
//       const questionEmbedding = questionEmbeddingResponse[0].embedding;

//       // 2. Find relevant chunks (simple similarity search)
//       const rankedChunks = processedChunksWithEmbeddings
//         .map(chunkData => ({
//           ...chunkData,
//           similarity: cosineSimilarity(questionEmbedding, chunkData.embedding)
//         }))
//         .sort((a, b) => b.similarity - a.similarity);

//       // 3. Create context (e.g., top 3 chunks)
//       const topK = 3;
//       const contextChunks = rankedChunks.slice(0, topK).filter(c => c.similarity > 0.5); // Add a similarity threshold
      
//       let context = "";
//       if (contextChunks.length > 0) {
//           context = contextChunks.map(c => c.chunk).join("\n---\n"); // Join chunks with a separator
//       } else {
//           context = "No relevant information found in the documents for this question.";
//       }


//       // 4. Get answer from Gemini
//       const answer = await getAnswerFromContext(context, question);
//       setChatHistory([...currentChatHistory, { sender: 'ai', text: answer }]);

//     } catch (error) {
//       console.error("Error getting answer:", error);
//       setErrorMessage(`Error answering question: ${error.message}`);
//       setChatHistory([...currentChatHistory, { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` }]);
//     } finally {
//       setIsLoadingAnswer(false);
//     }
//   };


//   return (
//     <div className="app-container">
//       <header className="header">Chat with Your Documents 📄🤖 <span className="emoji">💁</span></header>
//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//       <FileUploader
//         onProcess={handleFileProcessing}
//         processing={isProcessingFiles}
//         processingSuccess={processingSuccess}
//       />
//       <ChatInterface
//         onAskQuestion={handleAskQuestion}
//         chatHistory={chatHistory}
//         isReady={processedChunksWithEmbeddings.length > 0 && !isProcessingFiles}
//         isLoadingAnswer={isLoadingAnswer}
//       />
//     </div>
//   );
// }

// export default App;

// src/App.jsx
import React, { useState, useEffect } from 'react';
import './conponents/Style.css'; // Import your CSS styles
import FileUploader from './conponents/FileUploader';
import ChatInterface from './conponents/ChatInterface';

import {
  extractTextFromPdf,
  extractTextFromDocx,
  extractTextFromImage, // Note: OCR is still a placeholder here
  getTextChunks
} from './services/textExtractor';
import { getEmbeddings, getAnswerFromContext } from './services/geminiService';

// Simple cosine similarity (can be moved to a utils.js file)
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    console.warn("Cosine similarity: Invalid vectors provided or length mismatch.", vecA, vecB);
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
  if (normA === 0 || normB === 0) {
    console.warn("Cosine similarity: Zero norm vector encountered.");
    return 0; // Avoid division by zero
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function App() {
  const [processedChunksWithEmbeddings, setProcessedChunksWithEmbeddings] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingSuccess, setProcessingSuccess] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileProcessing = async (files) => {
    setIsProcessingFiles(true);
    setProcessingSuccess(false);
    setProcessedChunksWithEmbeddings([]); // Clear previous embeddings
    setChatHistory([]); // Clear previous chat
    setErrorMessage(''); // Clear previous errors
    let combinedText = "";

    try {
      for (const file of files) {
        let text = "";
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        if (file.type === "application/pdf") {
          text = await extractTextFromPdf(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "application/msword") {
          text = await extractTextFromDocx(file);
        } else if (file.type.startsWith("image/")) {
          try {
            // Note: extractTextFromImage currently returns a rejection.
            // You'd need a full Tesseract.js implementation or backend OCR.
            text = await extractTextFromImage(file);
          } catch (ocrError) {
            console.error("OCR Error in App.jsx:", ocrError);
            setErrorMessage(prev => `${prev}\nOCR for ${file.name} not fully implemented or failed: ${ocrError.message || ocrError}. Skipped.`);
          }
        } else if (file.type === "text/plain") {
          text = await file.text();
        } else {
          console.warn(`Unsupported file type: <span class="math-inline">\{file\.name\} \(</span>{file.type})`);
          setErrorMessage(prev => `${prev}\nUnsupported file type: ${file.name}. Skipped.`);
        }
        if (text && typeof text === 'string') combinedText += text + "\n\n"; // Ensure text is a string
      }

      if (!combinedText.trim()) {
        if (!errorMessage) setErrorMessage("No text could be extracted from the provided files. Please check file types, content, and console for errors.");
        setIsProcessingFiles(false);
        return;
      }

      const chunks = getTextChunks(combinedText);
      if (chunks.length === 0) {
         setErrorMessage("Text was extracted, but it resulted in no processable chunks.");
         setIsProcessingFiles(false);
         return;
      }

      console.log(`Generated ${chunks.length} text chunks. Requesting embeddings via proxy...`);
      // This calls your backend, which then calls Gemini
      const chunksWithEmbeddings = await getEmbeddings(chunks);
      setProcessedChunksWithEmbeddings(chunksWithEmbeddings);
      setProcessingSuccess(true);
      console.log("Embeddings received and set.");
      setTimeout(() => setProcessingSuccess(false), 4000); // Hide success message
    } catch (error) {
      console.error("Error during file processing or getting embeddings in App.jsx:", error);
      setErrorMessage(`Processing error: ${error.message || "An unknown error occurred. Check console for details."}`);
      setProcessingSuccess(false);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleAskQuestion = async (question) => {
    if (!question.trim() || processedChunksWithEmbeddings.length === 0) {
      setErrorMessage("Please process documents and ensure embeddings are available before asking a question.");
      return;
    }
    setIsLoadingAnswer(true);
    setErrorMessage(''); // Clear previous errors
    const currentChat = [...chatHistory, { sender: 'user', text: question }];
    setChatHistory(currentChat);

    try {
      console.log("Requesting embedding for question:", question);
      // This calls your backend for question embedding
      const questionEmbeddingResponse = await getEmbeddings([question]);

      if (!questionEmbeddingResponse?.[0]?.embedding || questionEmbeddingResponse[0].embedding.length === 0) {
        throw new Error("Could not get a valid embedding for the question. The embedding was empty or undefined.");
      }
      const questionEmbedding = questionEmbeddingResponse[0].embedding;
      console.log("Question embedding received.");

      const rankedChunks = processedChunksWithEmbeddings
        .map(chunkData => {
          const similarity = (chunkData.embedding && chunkData.embedding.length > 0)
                             ? cosineSimilarity(questionEmbedding, chunkData.embedding)
                             : 0;
          return { ...chunkData, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity);

      const topK = 3; // Number of top chunks to use as context
      // Add a similarity threshold, e.g., only consider chunks with similarity > 0.3
      const contextChunks = rankedChunks.slice(0, topK).filter(c => c.similarity > 0.3);

      let context = "No highly relevant information found in the documents for this specific question."; // Default context
      if (contextChunks.length > 0) {
          context = contextChunks.map(c => c.chunk).join("\n---\n"); // Join chunks with a separator
          console.log(`Using top ${contextChunks.length} chunks for context based on similarity.`);
      } else {
          console.log("No chunks met the similarity threshold to form context.");
      }
      
      // Log a snippet of the context being sent
      console.log("Context being sent to AI (first 200 chars):", context.substring(0, 200) + "...");

      // This calls your backend, which then calls Gemini for the answer
      const answer = await getAnswerFromContext(context, question);
      setChatHistory([...currentChat, { sender: 'ai', text: answer }]);
    } catch (error) {
      console.error("Error getting answer in App.jsx:", error);
      const displayError = `Sorry, I encountered an error while getting an answer: ${error.message || "Please try again."}`;
      setErrorMessage(displayError);
      // Optionally, add error to chat history as well
      setChatHistory([...currentChat, { sender: 'ai', text: displayError }]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">Chat with Your Documents 📄🤖 <span className="emoji">💁</span></header>
      {/* Display error messages with pre-wrap to respect newlines */}
      {errorMessage && <div className="error-message" style={{ whiteSpace: 'pre-wrap'}}>{errorMessage}</div>}
      <FileUploader
        onProcess={handleFileProcessing}
        processing={isProcessingFiles}
        processingSuccess={processingSuccess}
      />
      <ChatInterface
        onAskQuestion={handleAskQuestion}
        chatHistory={chatHistory}
        isReady={processedChunksWithEmbeddings.length > 0 && !isProcessingFiles} // Chat ready if embeddings exist and not processing
        isLoadingAnswer={isLoadingAnswer}
      />
    </div>
  );
}

export default App;