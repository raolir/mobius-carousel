import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { CarouselItem } from '../shared/carousel'
import { normalizeCarouselBackgroundColor, normalizeVisibleCardCount } from '../shared/carousel'
import { MobiusCarouselScene, type SelectionDisplayState } from './MobiusCarouselScene'
import { ResponsiveCarouselCamera } from './ResponsiveCarouselCamera'
import { SelectedCardOverlay } from './SelectedCardOverlay'
import { useCarouselRotation } from './useCarouselRotation'
import './styles.css'

interface MobiusCarouselProps {
  items: CarouselItem[]
  visibleCardCount: number
  backgroundColor: string
}

export function MobiusCarousel({ items, visibleCardCount, backgroundColor }: MobiusCarouselProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [selectionDisplay, setSelectionDisplay] = useState<SelectionDisplayState | null>(null)
  const targetRotationRef = useCarouselRotation(containerRef, selectionDisplay === null)
  const normalizedVisibleCardCount = normalizeVisibleCardCount(visibleCardCount)
  const normalizedBackgroundColor = normalizeCarouselBackgroundColor(backgroundColor)

  if (items.length === 0) {
    return (
      <section
        ref={containerRef}
        className="mobius-carousel mobius-carousel--empty"
        style={{ backgroundColor: normalizedBackgroundColor }}
      >
        <p>No carousel items are available.</p>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className="mobius-carousel"
      style={{ backgroundColor: normalizedBackgroundColor }}
    >
      <Canvas className="mobius-carousel__canvas">
        <color attach="background" args={[normalizedBackgroundColor]} />
        <ResponsiveCarouselCamera />
        <Suspense fallback={null}>
          <MobiusCarouselScene
            items={items}
            visibleCardCount={normalizedVisibleCardCount}
            targetRotationRef={targetRotationRef}
            onSelectionDisplayChange={setSelectionDisplay}
          />
        </Suspense>
      </Canvas>
      <SelectedCardOverlay
        item={selectionDisplay?.item ?? null}
        visible={selectionDisplay?.visible ?? false}
      />
    </section>
  )
}
