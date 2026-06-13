import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import CongratsAnimation from './components/CongratsAnimation';
import RedeemArea from './components/RedeemArea';
import Forbidden from './components/Forbidden';
import MessageToast from './components/MessageToast';
import { fetchPrize } from './apis/prize';
import { validateName } from './apis/user';
import './App.css';

const WIDTH = 300;
const HEIGHT = 150;
const BRUSH_SIZE = 30;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prize, setPrize] = useState('¥0.00');
  const [originalMoney, setOriginalMoney] = useState('0.00');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canScratch, setCanScratch] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);
  const [history, setHistory] = useState<{ money: string; time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [nameValid, setNameValid] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('');
  const userIdRef = useRef<number>(0);
  const isDrawingRef = useRef(false);
  const isRevealedRef = useRef(false);
  const prizeValueRef = useRef(prize);
  const originalMoneyRef = useRef('0.00');
  const luckyMoneyRef = useRef('0.00');

  // 校验用户名
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (!name) {
      setNameValid(false);
      return;
    }
    validateName(name).then((result) => {
      if (result.valid && result.userId != null && result.remainingCount != null) {
        setNameValid(true);
        setUserName(name);
        userIdRef.current = result.userId;
        setRemainingCount(result.remainingCount);
        setHistory(result.history || []);
        // 次数已用完，直接展示结算页
        if (result.remainingCount === 0) {
          const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let code = '';
          for (let i = 0; i < 15; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
          }
          setRedeemCode(code);
          setShowRedeem(true);
        }
      } else {
        setNameValid(false);
      }
    }).catch(() => {
      setNameValid(false);
    });
  }, []);

  const fetchPrizeData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrize(userIdRef.current);
      setPrize(`¥${data.originalMoney}`);
      prizeValueRef.current = `¥${data.luckyMoney}`;
      setOriginalMoney(data.originalMoney);
      originalMoneyRef.current = data.originalMoney;
      luckyMoneyRef.current = data.luckyMoney;
      setCanScratch(true);
    } catch {
      setErrorMsg('获取金额失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'auto';
    isRevealedRef.current = false;
    setShowCongrats(false);

    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawCoatingText('刮一刮');
  }, []);

  const drawCoatingText = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#999';
    ctx.font = '18px Microsoft Yahei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, WIDTH / 2, HEIGHT / 2);
  };

  useEffect(() => {
    if (!isRevealedRef.current) {
      drawCoatingText(canScratch ? '滑动刮开涂层查看金额' : '请点击开始刮奖按钮');
    }
  }, [canScratch]);

  useLayoutEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const checkScratchRatio = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealedRef.current) return;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = WIDTH * HEIGHT;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const ratio = transparentPixels / totalPixels;

    if (ratio >= 0.3) {
      isRevealedRef.current = true;
      revealPrize();
    }
  }, []);

  const revealPrize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gsap.to(canvas, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        canvas.style.pointerEvents = 'none';
      },
    });

    // 添加到历史记录
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const moneyValue = prizeValueRef.current.replace('¥', '');
    setHistory(prev => [{ money: moneyValue, time: timeStr }, ...prev]);
    // 减少剩余次数
    setRemainingCount(prev => prev - 1);

    // 延迟显示祝贺动画，确保状态已更新
    setTimeout(() => {
      setShowCongrats(true);
    }, 100);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canScratch || isRevealedRef.current) return;
    e.preventDefault();
    isDrawingRef.current = true;
    setIsDrawing(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = BRUSH_SIZE;
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.stroke();

    checkScratchRatio();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  const handleStartScratch = () => {
    fetchPrizeData();
  };

  const handleScratchAgain = () => {
    setShowCongrats(false);
    setCanScratch(false);
    initCanvas();
    fetchPrizeData();
  };

  const handleAutoHide = useCallback(() => {
    setShowCongrats(false);
    if (remainingCount === 0) {
      // 生成兑奖码
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 15; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      setRedeemCode(code);
      setShowRedeem(true);
    }
  }, [remainingCount]);

  // 校验未通过，显示禁止访问页
  if (nameValid === false) {
    return <Forbidden />;
  }

  return (
    <div className="container" ref={containerRef}>
      {errorMsg && (
        <MessageToast
          type="error"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}
      <p className="for-user">For {userName}</p>
      <h1 className="title">🎉 幸运刮刮乐 🎉</h1>
      <p className="subtitle">刮开涂层，赢取惊喜生日奖金！</p>
      
      {/* 剩余次数 */}
      <div className="info-bar">
        <span className="info-item">剩余次数：<strong>{remainingCount}</strong></span>
      </div>

      {/* 刮奖区域 / 兑奖区域 */}
      {showRedeem ? (
        <RedeemArea history={history} redeemCode={redeemCode} />
      ) : (
        <>
          <div className="scratch-box">
            <div className="prize" ref={prizeRef}>{prize}</div>
            <canvas
              ref={canvasRef}
              className="scratch-canvas"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
              style={{ cursor: canScratch ? (isDrawing ? 'grabbing' : 'grab') : 'not-allowed' }}
            />
          </div>


          {!canScratch ? (
            <button className="reset-btn" onClick={handleStartScratch} disabled={loading || remainingCount <= 0}>
              {loading ? '获取中...' : remainingCount <= 0 ? '次数已用完' : '开始刮奖'}
            </button>
          ) : null}
        </>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="history-section">
          <h3 className="history-title">📜 刮奖记录</h3>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-money">¥{item.money}</span>
                <span className="history-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 祝贺动画 */}
      {showCongrats && (
        <CongratsAnimation
          prize={prize}
          luckyMoney={luckyMoneyRef.current}
          remainingCount={remainingCount}
          onScratchAgain={handleScratchAgain}
          onAutoHide={handleAutoHide}
        />
      )}

      <footer className="copyright">
        <a href="https://github.com/CuberLuo/GuaGuaLe" target="_blank" rel="noopener noreferrer" className="github-link" title="GitHub">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
        <span>© {new Date().getFullYear()} 罗俊涛 All Rights Reserved</span>
      </footer>
    </div>
  );
}

export default App;
