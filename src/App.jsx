import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import WhatsApp from './pages/WhatsApp'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/whatsapp" element={<WhatsApp />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
