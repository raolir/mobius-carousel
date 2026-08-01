import { useEffect, useRef, type RefObject } from 'react'

const WHEEL_ROTATION_SENSITIVITY = 0.00045
const DRAG_ROTATION_PER_CANVAS_WIDTH = 0.5
const DRAG_THRESHOLD = 6

interface CarouselRotationController {
  targetRotationRef: RefObject<number>
  isDraggingRef: RefObject<boolean>
}

export function useCarouselRotation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
): CarouselRotationController {
  const targetRotationRef = useRef(0.5)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    let activePointerId: number | null = null
    let startX = 0
    let startY = 0
    let previousX = 0
    let gestureState: 'pending' | 'dragging' | 'rejected' = 'pending'
    let suppressNextClick = false

    const rotateWithWheel = (event: WheelEvent) => {
      if (!enabled) {
        return
      }

      event.preventDefault()
      targetRotationRef.current += event.deltaY * WHEEL_ROTATION_SENSITIVITY
    }

    const startDrag = (event: PointerEvent) => {
      if (
        !enabled ||
        !event.isPrimary ||
        activePointerId !== null ||
        (event.pointerType === 'mouse' && event.button !== 0)
      ) {
        return
      }

      activePointerId = event.pointerId
      startX = event.clientX
      startY = event.clientY
      previousX = event.clientX
      gestureState = 'pending'
      suppressNextClick = false
      canvas.setPointerCapture(event.pointerId)
    }

    const drag = (event: PointerEvent) => {
      if (!enabled || event.pointerId !== activePointerId) {
        return
      }

      if (gestureState === 'pending') {
        const horizontalDistance = Math.abs(event.clientX - startX)
        const verticalDistance = Math.abs(event.clientY - startY)

        if (horizontalDistance < DRAG_THRESHOLD && verticalDistance < DRAG_THRESHOLD) {
          return
        }

        if (horizontalDistance <= verticalDistance) {
          gestureState = 'rejected'
          return
        }

        gestureState = 'dragging'
        isDraggingRef.current = true
      }

      if (gestureState !== 'dragging') {
        return
      }

      const width = Math.max(canvas.clientWidth, 1)
      const horizontalDelta = event.clientX - previousX

      previousX = event.clientX
      targetRotationRef.current -= (horizontalDelta / width) * DRAG_ROTATION_PER_CANVAS_WIDTH
      event.preventDefault()
    }

    const resetPointer = (pointerId: number, suppressClick: boolean) => {
      if (pointerId !== activePointerId) {
        return
      }

      activePointerId = null
      suppressNextClick = suppressClick
      isDraggingRef.current = false

      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId)
      }
    }

    const endDrag = (event: PointerEvent) => {
      resetPointer(event.pointerId, gestureState !== 'pending')
    }

    const cancelDrag = (event: PointerEvent) => {
      resetPointer(event.pointerId, false)
    }

    const suppressDragClick = (event: MouseEvent) => {
      if (!suppressNextClick) {
        return
      }

      suppressNextClick = false
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    canvas.addEventListener('wheel', rotateWithWheel, { passive: false })
    canvas.addEventListener('pointerdown', startDrag)
    canvas.addEventListener('pointermove', drag)
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', cancelDrag)
    canvas.addEventListener('lostpointercapture', cancelDrag)
    canvas.addEventListener('click', suppressDragClick, true)

    return () => {
      if (activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
        canvas.releasePointerCapture(activePointerId)
      }

      activePointerId = null
      isDraggingRef.current = false
      canvas.removeEventListener('wheel', rotateWithWheel)
      canvas.removeEventListener('pointerdown', startDrag)
      canvas.removeEventListener('pointermove', drag)
      canvas.removeEventListener('pointerup', endDrag)
      canvas.removeEventListener('pointercancel', cancelDrag)
      canvas.removeEventListener('lostpointercapture', cancelDrag)
      canvas.removeEventListener('click', suppressDragClick, true)
    }
  }, [canvasRef, enabled])

  return { targetRotationRef, isDraggingRef }
}
