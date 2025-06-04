// src/services/textExtractor.js
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';
// import Tesseract from 'tesseract.js'; // Uncomment if using Tesseract.js

// Important: Configure the worker for pdf.js
// You might need to copy the worker file to your public directory
// and adjust the path accordingly.
// For Vite, you can put pdf.worker.min.js in public and it should be copied.
// For CRA, ensure it's in the public folder.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url // For Vite. For CRA, might need a different path or copy to public.
).toString();


export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      allText += textContent.items.map(item => item.str).join(" ") + "\n";
    }
    return allText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF.");
  }
}

export async function extractTextFromDocx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX.");
  }
}

export async function extractTextFromImage(file) {
  // Client-side OCR with Tesseract.js can be slow and resource-intensive.
  // Consider a backend solution for better performance and reliability.
  alert("OCR with Tesseract.js is a heavy client-side operation and might be slow. A backend solution is often preferred.");
  // try {
  //   const { data: { text } } = await Tesseract.recognize(
  //     file,
  //     'eng', // Language
  //     { logger: m => console.log(m) } // Optional: for progress logging
  //   );
  //   return text;
  // } catch (error) {
  //   console.error("Error extracting text from image with OCR:", error);
  //   throw new Error("Failed to perform OCR on image.");
  // }
  return Promise.reject("OCR not fully implemented client-side due to performance concerns. Consider a backend solution.");
}

export function getTextChunks(text, chunkSize = 1000, chunkOverlap = 200) {
  // A simple splitter, more sophisticated ones exist (like RecursiveCharacterTextSplitter in LangChain)
  const chunks = [];
  if (!text) return chunks;
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    chunks.push(text.substring(i, Math.min(i + chunkSize, text.length)));
  }
  return chunks;
}