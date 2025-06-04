// // src/components/ChatInterface.jsx
// import React, { useState } from 'react';

// function ChatInterface({ onAskQuestion, chatHistory, isReady, isLoadingAnswer }) {
//   const [userQuestion, setUserQuestion] = useState('');

//   const handleQuestionChange = (event) => {
//     setUserQuestion(event.target.value);
//   };

//   const handleSubmitQuestion = () => {
//     if (userQuestion.trim()) {
//       onAskQuestion(userQuestion.trim());
//       setUserQuestion('');
//     }
//   };

//   const handleKeyPress = (event) => {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault(); // Prevents newline in input
//       handleSubmitQuestion();
//     }
//   };

//   return (
//     <div className="chat-interface-container">
//       <h3>2. Ask Questions Based on Your Documents</h3>
//       {!isReady && <p style={{color: 'orange'}}>Please upload and process documents first.</p>}
//       <div className="chat-history">
//         {chatHistory.map((entry, index) => (
//           <div key={index} className={`chat-message ${entry.sender}`}>
//             <strong>{entry.sender === 'user' ? 'You' : 'Gemini Bot'}:</strong> {entry.text}
//           </div>
//         ))}
//         {isLoadingAnswer && <div className="chat-message ai"><div className="spinner"></div>Thinking...</div>}
//       </div>
//       <div className="chat-input-area">
//         <input
//           type="text"
//           value={userQuestion}
//           onChange={handleQuestionChange}
//           onKeyPress={handleKeyPress}
//           placeholder={isReady ? "Ask your question..." : "Process documents to enable chat"}
//           disabled={!isReady || isLoadingAnswer}
//         />
//         <button onClick={handleSubmitQuestion} disabled={!isReady || !userQuestion.trim() || isLoadingAnswer}>
//           Ask
//         </button>
//       </div>
//     </div>
//   );
// }

// export default ChatInterface;

// src/components/ChatInterface.jsx
 import React, { useState } from 'react';

 function ChatInterface({ onAskQuestion, chatHistory, isReady, isLoadingAnswer }) {
   const [userQuestion, setUserQuestion] = useState('');

   const handleQuestionChange = (event) => {
     setUserQuestion(event.target.value);
   };

   const handleSubmitQuestion = () => {
     if (userQuestion.trim()) {
       onAskQuestion(userQuestion.trim());
       setUserQuestion('');
     }
   };

   const handleKeyPress = (event) => {
     if (event.key === 'Enter' && !event.shiftKey && !isLoadingAnswer && isReady && userQuestion.trim()) {
       event.preventDefault();
       handleSubmitQuestion();
     }
   };

   return (
     <div className="chat-interface-container">
       <h3>2. Ask Questions Based on Your Documents</h3>
       {!isReady && <p style={{color: 'orange'}}>Please upload and process documents first to enable chat.</p>}
       <div className="chat-history">
         {chatHistory.map((entry, index) => (
           <div key={index} className={`chat-message ${entry.sender}`}>
             <strong>{entry.sender === 'user' ? 'You' : 'Gemini Bot'}:</strong> <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{entry.text}</pre>
           </div>
         ))}
         {isLoadingAnswer && <div className="chat-message ai"><div className="spinner"></div>Thinking...</div>}
       </div>
       <div className="chat-input-area">
         <input
           type="text"
           value={userQuestion}
           onChange={handleQuestionChange}
           onKeyPress={handleKeyPress}
           placeholder={isReady ? "Ask your question..." : "Process documents to enable chat"}
           disabled={!isReady || isLoadingAnswer}
         />
         <button onClick={handleSubmitQuestion} disabled={!isReady || !userQuestion.trim() || isLoadingAnswer}>
           Ask
         </button>
       </div>
     </div>
   );
 }

 export default ChatInterface;