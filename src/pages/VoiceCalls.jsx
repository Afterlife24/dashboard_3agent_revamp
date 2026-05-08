import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/VoiceCalls.css'

const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function VoiceCalls() {
    const navigate = useNavigate()
    const [callLogs, setCallLogs] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [sendingWhatsApp, setSendingWhatsApp] = useState({})
    const [expandedCall, setExpandedCall] = useState(null)

    useEffect(() => {
        fetchCallLogs()
        const interval = setInterval(fetchCallLogs, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchCallLogs = async () => {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/api/call-logs/logs`)
            setCallLogs(response.data.callLogs || [])
            setIsConnected(true)
        } catch (error) {
            console.error('Error fetching call logs:', error)
            setIsConnected(false)
        }
    }

    const formatPhoneNumber = (phone) => {
        if (!phone) return 'Unknown'
        return phone
    }

    const formatDuration = (seconds) => {
        if (!seconds) return '-'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }

    const formatDateTime = (timestamp) => {
        if (!timestamp) return '-'
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return '#10b981'
            case 'completed': return '#6366f1'
            case 'failed': return '#ef4444'
            default: return '#6b7280'
        }
    }

    const handleSendWhatsApp = async (phoneNumber, callId) => {
        setSendingWhatsApp(prev => ({ ...prev, [callId]: true }))
        try {
            const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:8000'
            const formattedNumber = phoneNumber.replace(/[\s()-]/g, '')

            const response = await axios.post(`${WHATSAPP_API_URL}/sendFormTemplate`, {
                phone_number: formattedNumber,
                call_id: callId
            })

            if (response.data.success) {
                // Update call log with message channel
                try {
                    await axios.post(`${BACKEND_API_URL}/api/call-logs/update-message-status`, {
                        callId: callId,
                        channel: response.data.channel,
                        status: 'sent'
                    })
                } catch (updateError) {
                    console.error('Failed to update call log:', updateError)
                }

                // Refresh call logs to show updated channel
                fetchCallLogs()

                if (response.data.fallback) {
                    alert(`⚠️ WhatsApp unavailable for ${phoneNumber}\n✅ SMS sent automatically instead`)
                } else if (response.data.channel === 'whatsapp') {
                    alert(`✅ WhatsApp sent successfully to ${phoneNumber}`)
                } else {
                    alert(`✅ Message sent via ${response.data.channel.toUpperCase()} to ${phoneNumber}`)
                }
            } else {
                alert(`❌ Failed to send message: ${response.data.error}`)
            }
        } catch (error) {
            console.error('Error sending message:', error)
            alert(`❌ Error: ${error.response?.data?.error || error.message}`)
        } finally {
            setSendingWhatsApp(prev => ({ ...prev, [callId]: false }))
        }
    }

    const toggleTranscript = (callId) => {
        setExpandedCall(expandedCall === callId ? null : callId)
    }

    return (
        <div className="voice-calls-container">
            {/* Header */}
            <div className="voice-calls-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="voice-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    </div>
                    <div className="header-title">
                        <h1>Voice Calls Agent</h1>
                        <p>Monitor and manage incoming voice calls</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="stats-badge">
                        <span className="stats-number">{callLogs.length}</span>
                        <span className="stats-label">Total Calls</span>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="voice-calls-content">
                <div className="table-wrapper">
                    {callLogs.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p>No calls yet</p>
                        </div>
                    ) : (
                        <table className="calls-table">
                            <thead>
                                <tr>
                                    <th>PHONE NUMBER</th>
                                    <th>START TIME</th>
                                    <th>DURATION</th>
                                    <th>STATUS</th>
                                    <th>LEAD SCORE</th>
                                    <th>PRIORITY</th>
                                    <th>LANGUAGE</th>
                                    <th>MESSAGE SENT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {callLogs.map((call) => (
                                    <tr key={call.callId} className="call-row">
                                        <td>
                                            <div className="phone-info">
                                                <div className="phone-avatar">
                                                    {call.phoneNumber.slice(-4)}
                                                </div>
                                                <span>{formatPhoneNumber(call.phoneNumber)}</span>
                                            </div>
                                        </td>
                                        <td>{formatDateTime(call.startTime)}</td>
                                        <td>{formatDuration(call.duration)}</td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(call.status) }}
                                            >
                                                {call.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="lead-score">
                                                {call.leadScoring?.totalScore || 0}
                                            </span>
                                        </td>
                                        <td>
                                            {call.leadScoring?.priority ? (
                                                <span
                                                    className={`priority-badge ${call.leadScoring.priority.toLowerCase()}`}
                                                    title={`${call.leadScoring.priority} Priority Lead`}
                                                >
                                                    {call.leadScoring.priority === 'HOT' && '🔴'}
                                                    {call.leadScoring.priority === 'WARM' && '🟠'}
                                                    {call.leadScoring.priority === 'COOL' && '🟡'}
                                                    {call.leadScoring.priority === 'LOW' && '🟢'}
                                                    {' '}{call.leadScoring.priority}
                                                </span>
                                            ) : (
                                                <span className="priority-badge none">-</span>
                                            )}
                                        </td>
                                        <td>{call.language?.toUpperCase() || 'EN'}</td>
                                        <td>
                                            {call.messageSent && call.messageSent.channel !== 'none' ? (
                                                <span
                                                    className={`channel-badge ${call.messageSent.channel}`}
                                                    title={`Sent via ${call.messageSent.channel.toUpperCase()}`}
                                                >
                                                    {call.messageSent.channel === 'whatsapp' ? '✓ WhatsApp' : '✓ SMS'}
                                                </span>
                                            ) : (
                                                <span className="channel-badge none">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    className="action-btn whatsapp-btn"
                                                    onClick={() => handleSendWhatsApp(call.phoneNumber, call.callId)}
                                                    disabled={sendingWhatsApp[call.callId]}
                                                    title="Send Message (Auto WhatsApp/SMS)"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </button>
                                                {call.transcript && call.transcript.length > 0 && (
                                                    <button
                                                        className="action-btn transcript-btn"
                                                        onClick={() => toggleTranscript(call.callId)}
                                                        title="View Transcript"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {call.leadScoring?.totalScore > 0 && (
                                                    <button
                                                        className="action-btn details-btn"
                                                        onClick={() => setExpandedCall(expandedCall === call.callId ? null : call.callId)}
                                                        title="View Lead Details"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Transcript Modal */}
            {expandedCall && callLogs.find(c => c.callId === expandedCall)?.transcript && (
                <div className="transcript-modal" onClick={() => setExpandedCall(null)}>
                    <div className="transcript-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="transcript-modal-header">
                            <h3>Call Transcript</h3>
                            <button className="close-btn" onClick={() => setExpandedCall(null)}>×</button>
                        </div>
                        <div className="transcript-modal-body">
                            {callLogs.find(c => c.callId === expandedCall)?.transcript?.map((msg, idx) => (
                                <div key={idx} className={`transcript-message ${msg.role}`}>
                                    <span className="message-role">
                                        {msg.role === 'user' ? 'Caller' : 'Agent'}
                                    </span>
                                    <span className="message-text">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Details Modal */}
            {expandedCall && callLogs.find(c => c.callId === expandedCall)?.leadScoring && (
                <div className="lead-details-modal" onClick={() => setExpandedCall(null)}>
                    <div className="lead-details-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="lead-details-modal-header">
                            <h3>Lead Scoring Details</h3>
                            <button className="close-btn" onClick={() => setExpandedCall(null)}>×</button>
                        </div>
                        <div className="lead-details-modal-body">
                            {(() => {
                                const lead = callLogs.find(c => c.callId === expandedCall)?.leadScoring;
                                return (
                                    <>
                                        <div className="lead-summary">
                                            <div className="lead-summary-item">
                                                <span className="label">Total Score:</span>
                                                <span className="value score">{lead.totalScore || 0}</span>
                                            </div>
                                            <div className="lead-summary-item">
                                                <span className="label">Priority:</span>
                                                <span className={`value priority ${lead.priority?.toLowerCase()}`}>
                                                    {lead.priority === 'HOT' && '🔴'}
                                                    {lead.priority === 'WARM' && '🟠'}
                                                    {lead.priority === 'COOL' && '🟡'}
                                                    {lead.priority === 'LOW' && '🟢'}
                                                    {' '}{lead.priority || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {lead.businessType && (
                                            <div className="lead-detail-section">
                                                <h4>Business Type</h4>
                                                <p>{lead.businessType}</p>
                                            </div>
                                        )}

                                        {lead.customerChannels && lead.customerChannels.length > 0 && (
                                            <div className="lead-detail-section">
                                                <h4>Customer Channels</h4>
                                                <div className="tags">
                                                    {lead.customerChannels.map((channel, idx) => (
                                                        <span key={idx} className="tag">{channel}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lead.painPoints && lead.painPoints.length > 0 && (
                                            <div className="lead-detail-section">
                                                <h4>Pain Points</h4>
                                                <div className="tags">
                                                    {lead.painPoints.map((point, idx) => (
                                                        <span key={idx} className="tag pain">{point}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lead.timeline && (
                                            <div className="lead-detail-section">
                                                <h4>Timeline</h4>
                                                <p>{lead.timeline}</p>
                                            </div>
                                        )}

                                        {lead.recommendedSolution && (
                                            <div className="lead-detail-section">
                                                <h4>Recommended Solution</h4>
                                                <p>{lead.recommendedSolution}</p>
                                            </div>
                                        )}

                                        {lead.confidenceSignals && lead.confidenceSignals.length > 0 && (
                                            <div className="lead-detail-section">
                                                <h4>Confidence Signals</h4>
                                                <div className="tags">
                                                    {lead.confidenceSignals.map((signal, idx) => (
                                                        <span key={idx} className="tag signal">{signal}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lead.breakdown && (
                                            <div className="lead-detail-section">
                                                <h4>Score Breakdown</h4>
                                                <div className="score-breakdown">
                                                    <div className="breakdown-item">
                                                        <span>Business Type:</span>
                                                        <span>{lead.breakdown.businessType || 0}</span>
                                                    </div>
                                                    <div className="breakdown-item">
                                                        <span>Channels:</span>
                                                        <span>{lead.breakdown.channels || 0}</span>
                                                    </div>
                                                    <div className="breakdown-item">
                                                        <span>Pain Points:</span>
                                                        <span>{lead.breakdown.painPoints || 0}</span>
                                                    </div>
                                                    <div className="breakdown-item">
                                                        <span>Timeline:</span>
                                                        <span>{lead.breakdown.timeline || 0}</span>
                                                    </div>
                                                    <div className="breakdown-item">
                                                        <span>Confidence Signals:</span>
                                                        <span>{lead.breakdown.confidenceSignals || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VoiceCalls
