import { useState, useEffect, useRef } from 'react'
import './ChatWindow.css'

function ChatWindow({ conversation, messages, onTakeover, onRelease, onSendMessage, onBack }) {
    const [messageInput, setMessageInput] = useState('')
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)

    // Handle mobile back button
    const handleMobileBack = () => {
        if (onBack) {
            onBack()
        }
    }

    // Debug: Log when conversation prop changes
    useEffect(() => {
        if (conversation) {
            console.log('💬 ChatWindow updated:', {
                phone: conversation.phone_number,
                human_takeover: conversation.human_takeover,
                timestamp: new Date().toISOString()
            })
        }
    }, [conversation])

    // Scroll to bottom when messages change or conversation changes
    useEffect(() => {
        // Use setTimeout to ensure DOM is updated before scrolling
        const timer = setTimeout(() => {
            scrollToBottom()
        }, 100)

        return () => clearTimeout(timer)
    }, [messages, conversation])

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
        // Also try scrolling the container directly
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }

    const handleSend = () => {
        if (messageInput.trim() && conversation) {
            onSendMessage(conversation.phone_number, messageInput)
            setMessageInput('')
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!conversation) {
        return (
            <div className="chat-panel">
                <div className="empty-state">
                    <p>💬</p>
                    <p>Select a conversation to view messages</p>
                </div>
            </div>
        )
    }

    const isHumanMode = conversation.human_takeover

    // Clean phone number - remove "whatsapp:" prefix
    const cleanPhoneNumber = conversation.phone_number.replace('whatsapp:', '')

    // Debug logging
    console.log('🔍 ChatWindow render:', {
        phone: conversation.phone_number,
        human_takeover: conversation.human_takeover,
        isHumanMode: isHumanMode,
        timestamp: new Date().toISOString()
    })

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <button className="chat-back-button" onClick={handleMobileBack} aria-label="Back to conversations">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="chat-user-info">
                    <h3>{cleanPhoneNumber}</h3>
                    <span className={`mode-badge ${isHumanMode ? 'human' : 'ai'}`}>
                        {isHumanMode ? 'HUMAN' : 'AI'}
                    </span>
                </div>
                <div className="chat-controls">
                    {!isHumanMode ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => onTakeover(conversation.phone_number)}
                        >
                            Take Over
                        </button>
                    ) : (
                        <button
                            className="btn btn-secondary"
                            onClick={() => onRelease(conversation.phone_number)}
                        >
                            Release
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <span className="no-messages-icon">💬</span>
                        <p>No messages yet</p>
                        <span className="no-messages-hint">Start a conversation or wait for messages</span>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            // Parse timestamp properly
                            let timeDisplay = '';
                            try {
                                const timestamp = msg.timestamp;
                                let date;

                                // Check if timestamp is ISO string or already a date
                                if (typeof timestamp === 'string') {
                                    date = new Date(timestamp);
                                } else {
                                    date = timestamp;
                                }

                                // Check if message is from today
                                const now = new Date();
                                const isToday = date.getDate() === now.getDate() &&
                                    date.getMonth() === now.getMonth() &&
                                    date.getFullYear() === now.getFullYear();

                                if (isToday) {
                                    // Show only time for today's messages
                                    timeDisplay = date.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    });
                                } else {
                                    // Show date and time for older messages
                                    timeDisplay = date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                    }) + ' ' + date.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    });
                                }
                            } catch (error) {
                                console.error('Error parsing timestamp:', error);
                                timeDisplay = msg.timestamp;
                            }

                            return (
                                <div
                                    key={index}
                                    className={`message ${msg.sender === 'user' ? 'user-message' : 'agent-message'}`}
                                >
                                    <div className="message-content">
                                        <p>{msg.content}</p>
                                        <span className="message-time">
                                            {timeDisplay}
                                            {msg.sender === 'agent' && (
                                                <span className="message-type">{msg.type === 'human' ? '👤' : '🤖'}</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="chat-input">
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isHumanMode ? 'Type your message...' : 'Take over to send messages'}
                    disabled={!isHumanMode}
                    rows={1}
                />
                <button
                    className="btn btn-send"
                    onClick={handleSend}
                    disabled={!isHumanMode || !messageInput.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default ChatWindow
