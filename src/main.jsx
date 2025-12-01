import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import './styles/global.css'
import './styles/Dashboard.css'
import './styles/WalletScreen.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from "./services/WalletContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(

    <WalletProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>

);