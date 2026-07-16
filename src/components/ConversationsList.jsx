import { useState } from 'react'
import './ConversationsList.css'

function ConversationsList({ conversations, selectedConversation, onSelectConversation }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.phone_number.includes(searchTerm)
    )

    const activeConversations = filteredConversations.filter(c => c.within_24h_window)
    const expiredConversations = filteredConversations.filter(c => !c.within_24h_window)

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const isToday = date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
            if (isToday) {
                return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
            } else {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
        } catch (error) {
            return timestamp;
        }
    }

    // How long ago the window expired, e.g. "expired 2h ago"
    const formatExpiredAgo = (lastUserMsgTime) => {
        if (!lastUserMsgTime) return 'window closed';
        try {
            const diffMs = Date.now() - new Date(lastUserMsgTime).getTime();
            const diffH = Math.floor(diffMs / (1000 * 60 * 60));
            const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            if (diffH >= 24) {
                const days = Math.floor(diffH / 24);
                return `${days}d ago`;
            }
            if (diffH > 0) return `${diffH}h ${diffM}m ago`;
            return `${diffM}m ago`;
        } catch {
            return 'window closed';
        }
    }

    const ConversationItem = ({ conv }) => (
        <div
            key={conv.phone_number}
            className={`conversation-item ${!conv.within_24h_window ? 'expired' : ''} ${selectedConversation?.phone_number === conv.phone_number ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv)}
        >
            <div className="conversation-info">
                <div className="conversation-header">
                    <span className="phone-number">{conv.phone_number.replace('whatsapp:', '')}</span>
                    <span className={`mode-badge ${conv.human_takeover ? 'human' : 'ai'}`}>
                        {conv.human_takeover ? 'Human' : 'AI'}
                    </span>
                </div>
                <p className="last-message">{conv.last_message}</p>
                <div className="conversation-footer">
                    <span className="timestamp">{formatTime(conv.last_message_time)}</span>
                    {conv.within_24h_window ? (
                        <span className="window-badge window-active">⏱ Session Active</span>
                    ) : (
                        <span className="window-badge window-expired" title={`Last user message: ${formatExpiredAgo(conv.last_user_message_time)}`}>
                            🕐 {formatExpiredAgo(conv.last_user_message_time)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="conversations-panel">
            <div className="conversations-panel-header">
                <h2>Conversations</h2>
                <span className="active-count">{activeConversations.length} active</span>
            </div>
            <input
                type="text"
                className="search-box"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="conversations-list">
                {/* Active sessions */}
                {activeConversations.length > 0 && (
                    <>
                        <div className="section-label">Active — within 24h window</div>
                        {activeConversations.map(conv => <ConversationItem key={conv.phone_number} conv={conv} />)}
                    </>
                )}

                {/* Expired sessions */}
                {expiredConversations.length > 0 && (
                    <>
                        <div className="section-label section-label--expired">History — window closed</div>
                        {expiredConversations.map(conv => <ConversationItem key={conv.phone_number} conv={conv} />)}
                    </>
                )}

                {filteredConversations.length === 0 && (
                    <div className="no-conversations">No conversations found</div>
                )}
            </div>
        </div>
    )
}

export default ConversationsList
