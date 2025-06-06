 import React, { useState } from 'react';

 function FileUploader({ onProcess, processing, processingSuccess }) {
   const [selectedFiles, setSelectedFiles] = useState([]);
   const [fileError, setFileError] = useState('');

   const handleFileChange = (event) => {
     setSelectedFiles([...event.target.files]);
     setFileError(''); // Clear previous file errors
   };

   const handleSubmit = () => {
     if (selectedFiles.length > 0) {
       onProcess(selectedFiles);
     } else {
       setFileError("Please select at least one file.");
     }
   };

   return (
     <div className="file-uploader-container">
       <h3>1. Upload Your Documents</h3>
       <input
         type="file"
         multiple
         accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
         onChange={handleFileChange}
         disabled={processing}
       />
       {fileError && <p style={{ color: 'red', fontSize: '0.9em' }}>{fileError}</p>}
       <button onClick={handleSubmit} disabled={processing || selectedFiles.length === 0}>
         {processing ? 'Processing...' : 'Submit & Process Files'}
       </button>
       {processing && <div className="spinner"></div>}
       {processingSuccess && <div className="success-message">Files processed successfully! Ready to chat.</div>}
     </div>
   );
 }

 export default FileUploader;