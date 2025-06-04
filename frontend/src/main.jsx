import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// No need to import Style.css here if App.jsx imports it.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)