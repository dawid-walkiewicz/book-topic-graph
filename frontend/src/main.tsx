import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode disabled due to WebGL context issues with deck.gl
createRoot(document.getElementById('root')!).render(<App />)
