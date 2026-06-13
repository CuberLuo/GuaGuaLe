import { useEffect, useState } from 'react';
import './MessageToast.css';

type ToastType = 'success' | 'error';

interface MessageToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

function MessageToast({ type, message, duration = 5000, onClose }: MessageToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // 等淡出动画结束后再移除
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`message-toast ${type} ${visible ? 'enter' : 'exit'}`}>
      <span className="message-icon">
        {type === 'success' ? '✓' : '✗'}
      </span>
      <span className="message-text">{message}</span>
    </div>
  );
}

export default MessageToast;
