import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react'
import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      toastClassName="app-toast"
      bodyClassName="app-toast-body"
    />
  </StrictMode>
);
