import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import { AuthProvider } from './context/AuthContext'
import { UiProvider } from './context/UiContext'
import { SiteProvider } from './context/SiteContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <SiteProvider>
            <UiProvider>
              <App />
            </UiProvider>
          </SiteProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
