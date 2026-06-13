import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import MessageToast from './MessageToast'
import './RedeemArea.css'

function RedeemArea({
  history,
  redeemCode,
}: {
  history: { money: string; time: string }[]
  redeemCode: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const amountRef = useRef<HTMLSpanElement>(null)
  const codeRef = useRef<HTMLDivElement>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleToastClose = useCallback(() => {
    setToastMsg('')
  }, [])

  // 自动复制兑奖码
  const autoCopy = useCallback(async () => {
    let success = false
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(redeemCode)
        success = true
      } catch {
        // Clipboard API 失败，尝试降级方案
      }
    }
    if (!success) {
      const textArea = document.createElement('textarea')
      textArea.value = redeemCode
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        success = document.execCommand('copy')
      } catch {
        success = false
      }
      document.body.removeChild(textArea)
    }
    setToastType(success ? 'success' : 'error')
    setToastMsg(
      success
        ? '兑奖码已复制，发送给罗俊涛即可兑奖'
        : '自动复制失败，请手动复制兑奖码',
    )
  }, [redeemCode])

  useEffect(() => {
    // 计算总金额
    const total = history.reduce((sum, item) => sum + parseFloat(item.money), 0)

    // 金额数字滚动动画
    if (amountRef.current) {
      const obj = { value: 0 }
      gsap.to(obj, {
        value: total,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          if (amountRef.current) {
            amountRef.current.textContent = `¥${obj.value.toFixed(2)}`
          }
        },
      })
    }

    // 兑奖码从下方滑入，滑入完成后自动复制
    if (codeRef.current) {
      gsap.fromTo(
        codeRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          delay: 1.5,
          onComplete: autoCopy,
        },
      )
    }

    // 整个容器从下方滑入
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      )
    }
  }, [history, autoCopy])

  return (
    <>
      {toastMsg && (
        <MessageToast
          type={toastType}
          message={toastMsg}
          onClose={handleToastClose}
        />
      )}
      <div className="redeem-area" ref={containerRef}>
        <div className="redeem-total">
          <span className="redeem-label">总金额</span>
          <span className="redeem-amount" ref={amountRef}>
            ¥0.00
          </span>
        </div>
        <div className="redeem-code-section" ref={codeRef}>
          <span className="redeem-code-label">兑奖码</span>
          <div className="redeem-code">{redeemCode}</div>
        </div>
      </div>
    </>
  )
}

export default RedeemArea
