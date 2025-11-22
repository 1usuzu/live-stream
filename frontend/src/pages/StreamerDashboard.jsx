import { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import { useAuth } from '../hooks/useAuth';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const StreamerDashboard = () => {
  const { user } = useAuth();
  const [streamKey, setStreamKey] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('gaming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Lấy hàm trackEvent
  const { trackEvent } = useMatomo();

  const API_URL = process.env.REACT_APP_API_URL;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadMyRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/rooms/my/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.rooms.length > 0) {
        const activeRoom = data.rooms.find(r => r.is_live);
        if (activeRoom) {
          setRoomInfo(activeRoom);
          setRoomId(activeRoom.room_id);
          setTitle(activeRoom.title);
          setDescription(activeRoom.description || '');
          setCategory(activeRoom.category || 'gaming');
        }
      }
    } catch (err) {
      console.error('Load rooms error:', err);
    }
  };

  useEffect(() => {
    if (user?.streamKey) {
      setStreamKey(user.streamKey);
    }
    loadMyRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createRoom = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề stream');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, category })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setRoomInfo(data.room);
      setRoomId(data.room.room_id);

      // --- MATOMO TRACKING ---
      trackEvent({
        category: 'Stream',
        action: 'Create Room Success',
        name: category, // Ghi nhận loại stream họ tạo
      });
      // -----------------------

      alert('Phòng stream đã được tạo! Bắt đầu stream từ OBS.');
    } catch (err) {
      setError(err.message);
      
      // Có thể track lỗi nếu muốn
      trackEvent({
        category: 'Error',
        action: 'Create Room Failed',
        name: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const endStream = async () => {
    if (!window.confirm('Bạn có chắc muốn kết thúc stream?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to end stream');
      }

      // --- MATOMO TRACKING ---
      trackEvent({
        category: 'Stream',
        action: 'End Stream',
        name: roomInfo?.title
      });
      // -----------------------

      setRoomInfo(null);
      setRoomId('');
      setTitle('');
      setDescription('');
      setCategory('gaming');
      alert('Stream đã kết thúc!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="viewer-layout">
      <main className="main-content">
        <div className="controls-overlay">
          <h2>Bảng điều khiển Streamer</h2>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="info-box">
            <div className="info-box-title">⚙️ Cấu hình OBS</div>
            <div className="form-group">
              <label className="form-label">RTMP URL</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value="rtmp://13.210.237.197:1935/live"
                  readOnly
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => copyToClipboard('rtmp://13.210.237.197:1935/live')}
                  className="btn-secondary"
                  style={{ minWidth: '80px' }}
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Stream Key</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={streamKey || 'Đang tải...'}
                  readOnly
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                />
                <button
                  onClick={() => copyToClipboard(streamKey)}
                  className="btn-secondary"
                  style={{ minWidth: '80px' }}
                  disabled={!streamKey}
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Dùng URL và Stream key này trong OBS để live
              </small>
            </div>
          </div>

          {!roomInfo ? (
            <div className="info-box">
              <div className="info-box-title">Tạo phòng stream mới</div>
              <div className="form-group">
                <label className="form-label required">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề stream..."
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả về stream của bạn..."
                  maxLength={500}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="talk">Talk Show</option>
                  <option value="creative">Creative</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                onClick={createRoom}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Đang tạo...' : 'Tạo phòng stream'}
              </button>
            </div>
          ) : (
            <div className="info-box">
              <div className="info-box-title">Thông tin phòng stream</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="live-badge" style={{ minWidth: '180px' }}>
                  <span className="status-indicator status-live"></span>
                  <span>ĐANG TRỰC TIẾP</span>
                </div>
              </div>
              <div className="info-item">
                <strong>Tiêu đề:</strong> {roomInfo.title}
              </div>
              <div className="info-item">
                <strong>Room ID:</strong> {roomInfo.room_id}
              </div>
              <div className="info-item">
                <strong>Danh mục:</strong> {roomInfo.category}
              </div>
              {roomInfo.description && (
                <div className="info-item">
                  <strong>Mô tả:</strong> {roomInfo.description}
                </div>
              )}
              <button
                onClick={endStream}
                disabled={loading}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  marginTop: '16px',
                  background: 'var(--error)',
                  borderColor: 'var(--error)'
                }}
              >
                {loading ? 'Đang kết thúc...' : '⏹ Kết thúc stream'}
              </button>
            </div>
          )}
        </div>
      </main>
      {roomId && <ChatBox roomId={roomId} isStreamer={true} />}
    </div>
  );
};

export default StreamerDashboard;