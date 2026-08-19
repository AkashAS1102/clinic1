import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

window.addEventListener('error', (event) => {
  document.body.innerHTML += `<div style="color:red;z-index:9999;position:fixed;top:0;left:0;background:white;padding:20px;border:2px solid red;"><pre>${event.error ? event.error.stack : event.message}</pre></div>`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
