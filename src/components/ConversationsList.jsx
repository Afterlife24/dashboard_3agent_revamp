import { useState } from 'react'
import './ConversationsList.css'

function ConversationsList({ conversations, selectedConversation, onSelectConversation }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.phone_number.includes(searchTerm)
    )

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
                            <span className="timestamp">{conv.last_message_time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ConversationsList
