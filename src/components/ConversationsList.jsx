import { useState } from 'react'
import './ConversationsList.css'

function ConversationsList({ conversations, selectedConversation, onSelectConversation }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.phone_number.includes(searchTerm)
    )

    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        try {
            const date = new Date(timestamp);
            const now = new Date();

            // Check if message is from today
            const isToday = date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();

            if (isToday) {
                // Show only time for today's messages - uses browser's locale and timezone
                return date.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            } else {
                // Show date for older messages - uses browser's locale
                return date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return timestamp;
        }
    }

    return (
        <div className="conversations-panel">
            <h2>Active Conversations</h2>
            <input
                type="text"
                className="search-box"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="conversations-list">
                {filteredConversations.map((conv) => (
                    <div
                        key={conv.phone_number}
                        className={`conversation-item ${selectedConversation?.phone_number === conv.phone_number ? 'active' : ''
                            }`}
                        onClick={() => onSelectConversation(conv)}
                    >
                        <div className="conversation-info">
                            <div className="conversation-header">
                                <span className="phone-number">{conv.phone_number}</span>
                                <span className={`mode-badge ${conv.human_takeover ? 'human' : 'ai'}`}>
                                    {conv.human_takeover ? 'Human' : 'AI'}
                                </span>
                            </div>
                            <p className="last-message">{conv.last_message}</p>
                            <span className="timestamp">{formatTime(conv.last_message_time)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ConversationsList
