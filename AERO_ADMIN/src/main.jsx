import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#0f2238',
            color: '#edf6ff',
            boxShadow: '0 12px 30px rgba(16, 41, 67, 0.2)',
          },
          success: { style: { background: '#0f5d4c', color: '#ecfff7' } },
          error: { style: { background: '#7d1f1f', color: '#fff2f2' } },
        }}
      />
    </>
  </StrictMode>
)
