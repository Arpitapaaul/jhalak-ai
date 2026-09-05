import { useEffect, useRef } from 'react'

export default function ReactiveCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  const mousePos = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const isHovered = useRef(false)
  const isMouseDown = useRef(false)
  const isVisible = useRef(false)
  const rafId = useRef(null)

  useEffect(() => {
    // Check if the device has a mouse/fine pointer (disable on touchscreens)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) return

    const onMouseMove = (e) => {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY

      if (!isVisible.current) {
        isVisible.current = true
        if (dotRef.current) dotRef.current.style.opacity = '1'
        if (ringRef.current) ringRef.current.style.opacity = '1'
      }

      // Zero-latency instant position for inner dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }
    }

    const onMouseDown = () => {
      isMouseDown.current = true
      if (ringRef.current) {
        ringRef.current.classList.add('cursor-clicked')
      }
    }

    const onMouseUp = () => {
      isMouseDown.current = false
      if (ringRef.current) {
        ringRef.current.classList.remove('cursor-clicked')
      }
    }

    const onMouseLeave = () => {
      isVisible.current = false
      if (dotRef.current) dotRef.current.style.opacity = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const onMouseEnter = () => {
      isVisible.current = true
      if (dotRef.current) dotRef.current.style.opacity = '1'
      if (ringRef.current) ringRef.current.style.opacity = '1'
    }

    // Detect hover over interactive elements
    const onMouseOver = (e) => {
      const target = e.target
      const isInteractive = target.closest(
        'a, button, input, label, .drop-zone, .card, .copy-button, .browse-link-btn, .category-checkbox-label'
      )

      if (isInteractive) {
        isHovered.current = true
        ringRef.current?.classList.add('cursor-hover')
        dotRef.current?.classList.add('cursor-dot-hover')
      } else {
        isHovered.current = false
        ringRef.current?.classList.remove('cursor-hover')
        dotRef.current?.classList.remove('cursor-dot-hover')
      }
    }

    // 60-120 FPS Physics-eased trailing loop
    const animateRing = () => {
      // Lerp formula: current + (target - current) * factor
      const ease = 0.16
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ease
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ease

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`
      }

      rafId.current = requestAnimationFrame(animateRing)
    }

    window.addEventListener('pointermove', onMouseMove, { passive: true })
    window.addEventListener('pointerdown', onMouseDown)
    window.addEventListener('pointerup', onMouseUp)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mouseover', onMouseOver)

    rafId.current = requestAnimationFrame(animateRing)

    return () => {
      window.removeEventListener('pointermove', onMouseMove)
      window.removeEventListener('pointerdown', onMouseDown)
      window.removeEventListener('pointerup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseover', onMouseOver)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  return (
    <>
      {/* Zero-latency Inner Pointer Dot */}
      <div ref={dotRef} className="reactive-cursor-dot" aria-hidden="true" />

      {/* Physics-eased Trailing Reactive Ring */}
      <div ref={ringRef} className="reactive-cursor-ring" aria-hidden="true">
        <div className="cursor-reticle-tick tick-top" />
        <div className="cursor-reticle-tick tick-bottom" />
        <div className="cursor-reticle-tick tick-left" />
        <div className="cursor-reticle-tick tick-right" />
      </div>
    </>
  )
}
