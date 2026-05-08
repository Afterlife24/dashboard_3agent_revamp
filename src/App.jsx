import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import WhatsApp from './pages/WhatsApp'
import VoiceCalls from './pages/VoiceCalls'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/whatsapp" element={<WhatsApp />} />
                <Route path="/voice-calls" element={<VoiceCalls />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
