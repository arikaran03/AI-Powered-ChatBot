// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
// // No need to import Style.css here if App.jsx imports it.

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// If Style.css is imported within App.jsx (as shown above),
// you don't necessarily need to import it here again.
// However, some prefer to import global styles at the very entry point.
// If your Style.css is in 'src/components/Style.css' and App.jsx imports it, this is fine.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)