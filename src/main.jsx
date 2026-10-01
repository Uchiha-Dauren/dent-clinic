import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { LanguageProvider } from './i18n';
import App from './App';
import './styles/fonts.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './styles/globals.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);