import { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const ChatBox = ({ roomId, isStreamer = false }) => {
  const { messages, sendMessage, deleteMessage, clearChat, connected, viewerCount } = useChat(roomId, isStreamer);
  const [input, setInput] = useState('');
  const logRef = useRef(null);
  
  // Lấy hàm trackEvent từ Matomo
  const { trackEvent } = useMatomo();

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      
      // --- MATOMO TRACKING ---
      trackEvent({
        category: 'Engagement',    // Danh mục: Tương tác
        action: 'Chat Message',    // Hành động: Chat
        name: `Room: ${roomId}`,   // Nhãn: Tại phòng nào
      });
      // -----------------------

      setInput('');
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Xóa tin nhắn này?')) {
      deleteMessage(messageId);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Xóa toàn bộ chat?')) {
      clearChat();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Chat trực tiếp</span>
            {connected && <span className="status-indicator status-live"></span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {connected && (
              <span className="chat-viewer-count">
                {viewerCount} người xem
              </span>
            )}
            {isStreamer && connected && (
              <button
                onClick={handleClearChat}
                className="btn-icon btn-sm"
                title="Xóa toàn bộ chat"
                style={{ width: '28px', height: '28px', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={logRef}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <p style={{ fontSize: '13px' }}>Chưa có tin nhắn nào</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className="chat-message" style={{ position: 'relative', paddingRight: isStreamer ? '32px' : '12px' }}>
            <span className={`chat-message-author ${isStreamer && msg.isStreamer ? 'streamer' : ''}`}>
              {msg.username}
            </span>
            <span className="chat-message-text">{msg.message}</span>
            {isStreamer && msg.id && (
              <button
                onClick={() => handleDeleteMessage(msg.id)}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '4px',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  opacity: 0.5
                }}
                title="Xóa tin nhắn"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
          disabled={!connected}
          maxLength={500}
          className="chat-input"
        />
        <button
          onClick={handleSend}
          disabled={!connected || !input.trim()}
          className="btn-blue chat-send-btn"
        >
          Gửi
        </button>
      </div>
    </div>
  );
};

export default ChatBox;