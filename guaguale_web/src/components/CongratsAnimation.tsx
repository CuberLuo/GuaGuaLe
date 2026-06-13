import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CongratsAnimation.css';

function CongratsAnimation({
  prize,
  luckyMoney,
  remainingCount,
  onScratchAgain,
  onAutoHide,
}: {
  prize: string;
  luckyMoney: string;
  remainingCount: number;
  onScratchAgain: () => void;
  onAutoHide: () => void;
}) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const bigLuckRef = useRef<HTMLDivElement>(null);
  const prizeRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLSpanElement>(null);
  const [showPrize, setShowPrize] = useState(false);

  const originalAmount = parseFloat(prize.replace('¥', ''));
  const luckyAmount = parseFloat(luckyMoney);

  useEffect(() => {
    // 彩纸爆炸
    if (confettiRef.current) {
      const confettiElements = confettiRef.current.querySelectorAll('.confetti');
      confettiElements.forEach((el, i) => {
        const angle = (i / confettiElements.length) * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        gsap.fromTo(el,
          { x: 0, y: 0, scale: 0, opacity: 1 },
          {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 100,
            scale: 1,
            opacity: 0,
            duration: 1.5 + Math.random(),
            ease: 'power2.out',
            delay: Math.random() * 0.3,
          }
        );
      });
    }

    // Phase 1: "大幸运" 夸张动效
    const luckEl = bigLuckRef.current;
    if (luckEl) {
      const tl = gsap.timeline();
      tl.fromTo(luckEl,
        { scale: 0, opacity: 0, rotation: -15 },
        { scale: 1.5, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }
      )
      .to(luckEl, { scale: 1.2, duration: 0.2, ease: 'power1.inOut' })
      .to(luckEl, { scale: 1.4, duration: 0.2, ease: 'power1.inOut', yoyo: true, repeat: 2 })
      .to(luckEl, { opacity: 0, scale: 0.5, duration: 0.4, ease: 'power2.in',
        onComplete: () => setShowPrize(true),
      });
    }

    return () => {};
  }, []);

  // Phase 2: 金额翻倍计数动画
  useEffect(() => {
    if (!showPrize || !amountRef.current) return;

    const obj = { value: originalAmount };
    gsap.to(obj, {
      value: luckyAmount,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (amountRef.current) {
          amountRef.current.textContent = `¥${obj.value.toFixed(2)}`;
        }
      },
    });

    // 最后一次刮奖时自动隐藏
    const timer = remainingCount === 0 ? setTimeout(() => {
      onAutoHide();
    }, 3000) : undefined;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showPrize, originalAmount, luckyAmount, remainingCount, onAutoHide]);

  return (
    <div className="congrats-overlay">
      <div className="confetti-container" ref={confettiRef}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb'][i % 5],
              left: '50%',
              top: '50%',
            }}
          />
        ))}
      </div>

      {/* Phase 1: 大幸运 */}
      <div className="big-luck" ref={bigLuckRef}>
        <div className="big-luck-text">🎊 大幸运! 🎊</div>
      </div>

      {/* Phase 2: 金额翻倍 */}
      {showPrize && (
        <div className="congrats-text" ref={prizeRef}>
          <div className="congrats-title">🎊 恭喜中奖 🎊</div>
          <div className="congrats-prize">
            <span className="prize-original">¥{originalAmount.toFixed(2)}</span>
            <span className="prize-arrow">→</span>
            <span className="prize-doubled" ref={amountRef}>¥{luckyAmount.toFixed(2)}</span>
          </div>
          {remainingCount > 0 && (
            <button className="scratch-again-btn" onClick={onScratchAgain}>
              再刮一次（剩余 {remainingCount} 次）
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CongratsAnimation;
