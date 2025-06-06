import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import the custom CSS
import App from './App'; // Assuming App.js is in the same directory
import reportWebVitals from './reportWebVitals'; // You might already have this or can remove it if not needed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
    document.getElementById('current-year').textContent = new Date().getFullYear();


   