# AI-Powered PDF ChatBot 📄🤖💬

**Ask questions and get answers directly from your PDF documents!** This application allows you to upload multiple PDF files, leverages Google's Gemini AI to understand their content, and provides a chat interface to query information contained within them.

## 🌟 Features

* **Multiple PDF Uploads:** Upload and process several PDF documents simultaneously.
* **Text Extraction:** Intelligently extracts text content from your PDFs using `pdf.js`.
* **AI-Powered Embeddings:** Utilizes Google's Gemini embedding models (via a secure backend proxy) to create numerical representations of your document content.
* **Contextual Q&A:** When you ask a question:
    * Your question is also embedded.
    * The most relevant text chunks from your documents are found using cosine similarity.
    * This relevant context is provided to a Gemini generative model to formulate an answer.
* **Interactive Chat Interface:** Clean and simple UI to ask questions and view responses.
* **Secure API Key Handling:** Your Google Gemini API key is kept secure on a Node.js backend proxy, not exposed in the frontend.
* **Support for other document types (Experimental/Basic):** Basic text extraction for `.docx` (Word) and `.txt` files. Client-side OCR for images is included as a placeholder but marked as experimental due to performance considerations.

## 🛠️ Technologies Used

**Frontend:**
* React (with Vite)
* JavaScript (ES6+)
* HTML5 & CSS3
* `pdfjs-dist` (for PDF text extraction)
* `mammoth` (for .docx text extraction)
* `tesseract.js` (placeholder for client-side OCR)

**Backend (Proxy Server):**
* Node.js
* Express.js
* `node-fetch` (for making requests to the Gemini API)
* `cors` (for Cross-Origin Resource Sharing)
* `dotenv` (for environment variable management)

**AI Service:**
* Google Gemini API (via REST calls)
    * Embedding Model (e.g., `embedding-001`)
    * Generative Model (e.g., `gemini-1.5-flash-latest`)

## 📁 Project Structure

The repository is organized into two main parts:

* **`backend/`** : Houses the Node.js Express backend proxy.
    * `.env`: Stores backend environment variables, primarily your `GOOGLE_API_KEY`.
    * `server.js`: Contains the main server logic, API routes, and communication with the Gemini API.
    * `package.json`: Lists backend dependencies (like Express, cors, dotenv, node-fetch) and scripts.
* **`frontend/`**: Contains the React Vite frontend application.
    * `public/`: Stores static assets that are served directly.
        * `pdf.worker.min.mjs`: The essential worker script for `pdf.js` to process PDFs.
    * `src/`: Contains the frontend source code.
        * `components/`: Reusable React UI components (e.g., `FileUploader.jsx`, `ChatInterface.jsx`, `Style.css`).
        * `services/`: Modules for specific functionalities like text extraction (`textExtractor.js`) and communicating with the backend (`geminiService.js`).
        * `App.jsx`: The main application component orchestrating the UI and logic.
        * `main.jsx`: The entry point for the React application.
    * `.env`: Stores frontend environment variables, specifically `VITE_BACKEND_API_URL`.
    * `package.json`: Lists frontend dependencies (like React, pdfjs-dist, mammoth) and scripts.



## 🚀 Getting Started

### Prerequisites

* Node.js (v16 or higher recommended)
* npm (comes with Node.js)
* A Google Gemini API Key (enable the "Generative Language API" or "Gemini API" in your Google Cloud project and ensure billing is active).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/arikaran03/AI-Powered-ChatBot.git](https://github.com/arikaran03/AI-Powered-ChatBot.git)
    cd AI-Powered-ChatBot
    ```

**I. Backend Setup (`backend/` directory):**

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a `.env` file** in the `backend` directory and add your Google Gemini API key:
    ```env
    # backend/.env
    GOOGLE_API_KEY="YOUR_ACTUAL_GOOGLE_GEMINI_API_KEY_HERE"
    PORT=3001
    ```
    *Replace with your actual API key.*

3.  **Install backend dependencies:**
    ```bash
    npm install
    ```

**II. Frontend Setup (`frontend/` directory):**

1.  **Navigate to the frontend directory from the root:**
    ```bash
    cd ../frontend
    # Or, if you are already in the 'backend' folder: cd ../frontend
    ```

2.  **Copy the PDF.js worker file:**
    * Locate `pdf.worker.min.mjs` in `frontend/node_modules/pdfjs-dist/build/`.
    * **Copy** this `pdf.worker.min.mjs` file.
    * **Paste** it into the `frontend/public/` directory.

3.  **Create a `.env` file** in the `frontend` directory to specify the backend URL:
    ```env
    # frontend/.env
    VITE_BACKEND_API_URL="http://localhost:3001/api/gemini"
    ```
    *(Ensure the port `3001` matches the `PORT` in the backend's `.env` file if you changed it).*

4.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    * Open a terminal, navigate to the `backend` directory.
    * Run:
        ```bash
        node server.js
        ```
    * You should see a message like `✅ Backend proxy server running on http://localhost:3001`. Keep this terminal running.

2.  **Start the Frontend Development Server:**
    * Open a **new, separate** terminal.
    * Navigate to the `frontend` directory.
    * Run:
        ```bash
        npm run dev
        ```
    * This will usually open the application in your browser at `http://localhost:5173`.

## 📖 How to Use

1.  Once both servers are running, open your browser to `http://localhost:5173`.
2.  Click the "Choose Files" button (or similar) to upload one or more PDF documents (you can also try `.docx` or `.txt`).
3.  Click the "Submit & Process Files" button. Wait for the processing to complete (you should see a success message).
4.  Once processed, the chat interface will be enabled. Type your question related to the content of the uploaded documents into the input field.
5.  Click "Ask" or press Enter.
6.  The AI's answer, based on the document context, will appear in the chat history.

## 💡 Troubleshooting

* **"Failed to extract text from PDF":**
    * Ensure `pdf.worker.min.mjs` is correctly copied to the `frontend/public/` directory.
    * Ensure `pdfjsLib.GlobalWorkerOptions.workerSrc = \`/pdf.worker.min.mjs\`;` is correctly set in `frontend/src/services/textExtractor.js`.
    * Ensure the worker version matches the API version (re-copy from `node_modules` if you recently updated `pdfjs-dist`).
* **Errors related to Gemini API (500, 400, 403, 404 from backend logs):**
    * Verify your `GOOGLE_API_KEY` in `backend/.env` is correct and active.
    * Ensure the "Generative Language API" (or "Gemini API") is enabled in your Google Cloud Console.
    * Check if billing is enabled for your Google Cloud project.
    * Verify the model names used in `backend/server.js` (e.g., `embedding-001:embedContent`, `gemini-1.5-flash-latest:generateContent`) are current and supported.
* **Frontend can't connect to backend:**
    * Ensure the backend server is running.
    * Verify `VITE_BACKEND_API_URL` in `frontend/.env` points to the correct backend address and port.
    * Check for CORS errors in the browser console (though the provided `server.js` should handle this for `localhost:5173`).
* **Restart Servers:** After any changes to `.env` files or significant code modifications, always restart both the frontend and backend servers.

## 🌱 Future Enhancements

* [ ] Implement robust client-side or backend OCR for scanned PDFs/images.
* [ ] Store and reuse embeddings for uploaded documents (e.g., using `localStorage` or a vector database for persistence).
* [ ] Display source document/page number for answers.
* [ ] Add support for more file types.
* [ ] Improve UI/UX, add loading indicators for individual file processing.
* [ ] More advanced text chunking strategies.
* [ ] Option to select different Gemini models.

##🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/arikaran03/AI-Powered-ChatBot/issues).

## 📜 License

This project can be considered under the [MIT License](LICENSE.md) (You would need to create a `LICENSE.md` file with the MIT license text if you choose this).

---