import { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';

const FlvPlayer = ({ streamKey, autoPlay = true }) => {
    const videoRef = useRef(null);
    const flvPlayerRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Dùng backend proxy thay vì direct RTMP
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const FLV_BASE = `${API_URL.replace('/api', '')}/api/stream-proxy/live`;

    useEffect(() => {
        if (!streamKey) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const video = videoRef.current;
        // URL format: /live/{streamKey}.flv
        const flvUrl = `${FLV_BASE}/${streamKey}.flv`;

        if (flvjs.isSupported()) {
            const flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: flvUrl,
                isLive: true,
                hasAudio: true,
                hasVideo: true
            }, {
                enableWorker: false,
                enableStashBuffer: false,
                stashInitialSize: 128,
                lazyLoad: false,
                autoCleanupSourceBuffer: true
            });

            flvPlayerRef.current = flvPlayer;
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();

            flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
                setLoading(false);
            });

            flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
                console.error('FLV Error:', errorType, errorDetail);
                setError('Không thể tải stream. Vui lòng thử lại.');
                setLoading(false);
            });

            if (autoPlay) {
                video.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            }

            setLoading(false);
        } else {
            setError('Trình duyệt không hỗ trợ FLV streaming');
            setLoading(false);
        }

        return () => {
            if (flvPlayerRef.current) {
                flvPlayerRef.current.pause();
                flvPlayerRef.current.unload();
                flvPlayerRef.current.detachMediaElement();
                flvPlayerRef.current.destroy();
                flvPlayerRef.current = null;
            }
        };
    }, [streamKey, autoPlay, API_URL, FLV_BASE]);

    if (!streamKey) {
        return (
            <div className="video-container" style={{
                background: 'var(--yt-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                borderRadius: '8px'
            }}>
                <div style={{ textAlign: 'center', color: 'var(--yt-text-secondary)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
                    <p>Chọn một stream để xem</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-container" style={{ position: 'relative', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 10
                }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        <p>Đang tải stream...</p>
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 10
                }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                controls
                playsInline
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '70vh'
                }}
            />
        </div>
    );
};

export default FlvPlayer;
