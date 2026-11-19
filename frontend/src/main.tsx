import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import { LangProvider } from './i18n';
import { installDomTranslate } from './i18n/domTranslate';
import { installLangSync } from './i18n/langSync';
import { ThemeProvider } from './theme/ThemeContext';
import './styles.css';
import './components/polish.css';
import './components/refine.css';
import './components/dashx.css';
import './components/admin-v13.css';

installDomTranslate();
installLangSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {/* Truyền hàm cho LangProvider: đổi ngôn ngữ thì render lại toàn bộ chữ mà không gỡ cây giao diện */}
      <LangProvider>
        {() => (
          <BrowserRouter>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        )}
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
);
