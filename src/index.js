// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Importa Bootstrap + CSS global
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
