// src/components/FileUploader.jsx
import React, { useState } from 'react';

function FileUploader({ onProcess, processing, processingSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onProcess(selectedFiles);
    } else {
      alert("Please select at least one file.");
    }
  };

  return (
    <div className="file-uploader-container">
      <h3>1. Upload Your Documents</h3>
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" // Added image types for OCR
        onChange={handleFileChange}
        disabled={processing}
      />
      <button onClick={handleSubmit} disabled={processing || selectedFiles.length === 0}>
        {processing ? 'Processing...' : 'Submit & Process Files'}
      </button>
      {processing && <div className="spinner"></div>}
      {processingSuccess && <div className="success-message">Files processed successfully!</div>}
    </div>
  );
}

export default FileUploader;