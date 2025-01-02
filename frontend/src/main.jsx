import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Your global CSS
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ShopContextProvider from './Context/ShopContext';
import App from './App';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ShopContextProvider>

      <App />
    
  </ShopContextProvider>
);
