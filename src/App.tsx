import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { AccountPage } from './pages/AccountPage';
import { PostcodeProvider } from './components/PostcodeChecker';
import { CartProvider } from './contexts/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { ToastProvider } from './components/Toast';

export function App() {
  return (
    <ToastProvider>
      <PostcodeProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
            {/* Cart Drawer - renders conditionally based on cartOpen state */}
            <CartDrawer />
          </BrowserRouter>
        </CartProvider>
      </PostcodeProvider>
    </ToastProvider>
  );
}