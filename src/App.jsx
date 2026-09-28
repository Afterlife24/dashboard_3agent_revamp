import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import WhatsApp from './pages/WhatsApp'
import VoiceCalls from './pages/VoiceCalls'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/whatsapp"
                    element={
                        <ProtectedRoute>
                            <WhatsApp />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/voice-calls"
                    element={
                        <ProtectedRoute>
                            <VoiceCalls />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
