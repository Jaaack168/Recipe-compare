import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { Cart } from './pages/Cart';
import { AccountPage } from './pages/AccountPage';
import { PostcodeProvider } from './components/PostcodeChecker';
import { CartProvider } from './contexts/CartContext';

export function App() {
  return (
    <PostcodeProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </PostcodeProvider>
  );
}