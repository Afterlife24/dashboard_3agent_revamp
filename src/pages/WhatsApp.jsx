import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ConversationsList from '../components/ConversationsList'
import ChatWindow from '../components/ChatWindow'
import '../styles/WhatsApp.css'

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:8000'

function WhatsApp() {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const previousTakeoverStates = useRef(new Map())
    const audioContextRef = useRef(null)
    const audioUnlockedRef = useRef(false)

    // Initialize audio context on first user interaction
    const unlockAudio = () => {
        if (!audioUnlockedRef.current) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)()
                audioContextRef.current = audioContext

                // Resume context if suspended
                if (audioContext.state === 'suspended') {
                    audioContext.resume()
                }

                audioUnlockedRef.current = true
                console.log('🔊 Audio unlocked and ready')
            } catch (error) {
                console.error('Error unlocking audio:', error)
            }
        }
    }

    // Function to play notification sound
    const playNotificationSound = () => {
        try {
            // Use existing audio context or create new one
            const audioContext = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)()

            // Resume if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume()
            }

            // Create iPhone tri-tone notification sound
            const playTone = (frequency, startTime, duration) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = frequency
                oscillator.type = 'sine'

                // Smooth attack and decay
                gainNode.gain.setValueAtTime(0, startTime)
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02)
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

                oscillator.start(startTime)
                oscillator.stop(startTime + duration)
            }

            // iPhone tri-tone: three ascending notes
            const now = audioContext.currentTime
            playTone(1108, now, 0.15)           // C6
            playTone(1319, now + 0.08, 0.15)    // E6
            playTone(1568, now + 0.16, 0.4)     // G6

            console.log('🔔 iPhone notification sound played')
        } catch (error) {
            console.error('Error playing notification sound:', error)
        }
    }

    // Unlock audio on any user interaction
    useEffect(() => {
        const handleInteraction = () => {
            unlockAudio()
        }

        // Listen for various user interactions
        document.addEventListener('click', handleInteraction)
        document.addEventListener('keydown', handleInteraction)
        document.addEventListener('touchstart', handleInteraction)

        return () => {
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
            document.removeEventListener('touchstart', handleInteraction)
        }
    }, [])

    useEffect(() => {
        fetchConversations()
        const interval = setInterval(fetchConversations, 3000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.phone_number)
            const interval = setInterval(() => {
                fetchMessages(selectedConversation.phone_number)
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [selectedConversation])

    const fetchConversations = async () => {
        try {
            const response = await axios.get(`${WHATSAPP_API_URL}/conversations`)

            // Sort conversations by last message time (most recent first)
            const sortedConversations = response.data.sort((a, b) => {
                const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
                const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
                return timeB - timeA // Descending order (newest first)
            })

            // Check for takeover state changes and play notification
            sortedConversations.forEach(conv => {
                const previousState = previousTakeoverStates.current.get(conv.phone_number)
                const currentState = conv.human_takeover

                // If takeover just happened (changed from false/undefined to true)
                if (previousState === false && currentState === true) {
                    console.log('🔔 Human takeover detected for:', conv.phone_number)
                    playNotificationSound()
                }

                // Update the state
                previousTakeoverStates.current.set(conv.phone_number, currentState)
            })

            setConversations(sortedConversations)
            setIsConnected(true)

            // CRITICAL: Always update selected conversation to sync the chat window
            if (selectedConversation) {
                const updatedSelected = sortedConversations.find(
                    conv => conv.phone_number === selectedConversation.phone_number
                )
                if (updatedSelected) {
                    // Force update even if the object looks the same
                    setSelectedConversation(updatedSelected)

                    // Log if takeover state changed
                    if (selectedConversation.human_takeover !== updatedSelected.human_takeover) {
                        console.log('🔄 Takeover state changed:', {
                            phone: updatedSelected.phone_number,
                            old: selectedConversation.human_takeover,
                            new: updatedSelected.human_takeover
                        })
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
            setIsConnected(false)
        }
    }

    const fetchMessages = async (phoneNumber) => {
        try {
            const response = await axios.get(`${WHATSAPP_API_URL}/messages/${phoneNumber}`)
            setMessages(response.data)

            // Debug: Log timestamps
            if (response.data.length > 0) {
                console.log('📨 Received messages:', response.data.length)
                console.log('   First message timestamp:', response.data[0].timestamp)
                console.log('   Last message timestamp:', response.data[response.data.length - 1].timestamp)
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const handleTakeover = async (phoneNumber) => {
        try {
            await axios.post(`${WHATSAPP_API_URL}/takeover`, { phone_number: phoneNumber })

            // Immediately update the UI
            setSelectedConversation(prev => ({
                ...prev,
                human_takeover: true
            }))

            // Fetch fresh data from server
            await Promise.all([
                fetchConversations(),
                fetchMessages(phoneNumber)
            ])

            console.log('✅ Takeover successful, UI updated')
        } catch (error) {
            console.error('Error taking over:', error)
        }
    }

    const handleRelease = async (phoneNumber) => {
        try {
            await axios.post(`${WHATSAPP_API_URL}/release`, { phone_number: phoneNumber })

            // Immediately update the UI
            setSelectedConversation(prev => ({
                ...prev,
                human_takeover: false
            }))

            // Fetch fresh data from server
            await Promise.all([
                fetchConversations(),
                fetchMessages(phoneNumber)
            ])

            console.log('✅ Release successful, UI updated')
        } catch (error) {
            console.error('Error releasing:', error)
        }
    }

    const handleSendMessage = async (phoneNumber, message) => {
        try {
            await axios.post(`${WHATSAPP_API_URL}/send-message`, {
                phone_number: phoneNumber,
                message: message
            })
            fetchMessages(phoneNumber)
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    return (
        <div className="whatsapp-container">
            {/* Header */}
            <div className="whatsapp-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="whatsapp-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                    </div>
                    <div className="header-title">
                        <h1>WhatsApp Agent</h1>
                        <p>Manage customer conversations with AI assistance</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="stats-badge">
                        <span className="stats-number">{conversations.length}</span>
                        <span className="stats-label">Active Chats</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="whatsapp-content">
                <ConversationsList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                />
                <ChatWindow
                    key={selectedConversation ? `${selectedConversation.phone_number}-${selectedConversation.human_takeover}` : 'no-conversation'}
                    conversation={selectedConversation}
                    messages={messages}
                    onTakeover={handleTakeover}
                    onRelease={handleRelease}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
    )
}

export default WhatsApp
