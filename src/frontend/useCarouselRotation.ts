import { useEffect, useRef, type RefObject } from 'react'

const WHEEL_ROTATION_SENSITIVITY = 0.00045

export function useCarouselRotation(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): RefObject<number> {
  const targetRotationRef = useRef(0.5)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const rotateWithWheel = (event: WheelEvent) => {
      if (!enabled) {
        return
      }

      event.preventDefault()
      targetRotationRef.current += event.deltaY * WHEEL_ROTATION_SENSITIVITY
    }

    container.addEventListener('wheel', rotateWithWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', rotateWithWheel)
    }
  }, [containerRef, enabled])

  return targetRotationRef
}
