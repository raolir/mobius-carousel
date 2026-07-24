import { useRef, useState, type RefObject } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarouselItem } from '../shared/carousel'
import { getRotationSlotState, getSlotItemIndex } from './carouselSlots'
import { MobiusCarouselCard, type MobiusCardSelection } from './MobiusCarouselCard'
import { getMobiusCardDimensions, getShortestPhaseDelta } from './mobiusMath'
import {
  SelectedCardTransition,
  type SelectedCardState,
  type SelectionPhase,
} from './SelectedCardTransition'

const BASE_RIG_ROTATION_X = THREE.MathUtils.degToRad(8)
const BASE_RIG_ROTATION_Y = 0
const POINTER_ROTATION_X = THREE.MathUtils.degToRad(4)
const POINTER_ROTATION_Y = THREE.MathUtils.degToRad(6)
const POINTER_ROTATION_DAMPING = 3
const SELECTION_OFFSET_DAMPING = 3
const SELECTION_DURATION = 0.65
const DESELECTION_DURATION = 0.45
const FRONT_PHASE = 0.5

const texturelessTexture = new THREE.DataTexture(
  new Uint8Array([232, 232, 232, 255]),
  1,
  1,
  THREE.RGBAFormat,
)
texturelessTexture.colorSpace = THREE.SRGBColorSpace
texturelessTexture.needsUpdate = true

export interface SelectionDisplayState {
  item: CarouselItem
  visible: boolean
}

interface MobiusCarouselSceneProps {
  items: CarouselItem[]
  visibleCardCount: number
  targetRotationRef: RefObject<number>
  onSelectionDisplayChange: (selection: SelectionDisplayState | null) => void
}

export function MobiusCarouselScene({
  items,
  visibleCardCount,
  targetRotationRef,
  onSelectionDisplayChange,
}: MobiusCarouselSceneProps) {
  const imageUrls = [...new Set(items.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])))]
  const loadedTextures = useTexture(imageUrls, (textures) => {
    for (const texture of textures as THREE.Texture[]) {
      texture.colorSpace = THREE.SRGBColorSpace
    }
  }) as THREE.Texture[]
  const texturesByUrl = new Map<string, THREE.Texture>()

  imageUrls.forEach((url, index) => {
    const texture = loadedTextures[index]

    if (texture) {
      texturesByUrl.set(url, texture)
    }
  })

  const parallaxRef = useRef<THREE.Group>(null)
  const carouselRef = useRef<THREE.Group>(null)
  const currentRotationRef = useRef(0)
  const displayOffsetRef = useRef(0)
  const selectionPhaseRef = useRef<SelectionPhase>('idle')
  const selectionProgressRef = useRef(0)
  const [selection, setSelection] = useState<SelectedCardState | null>(null)
  const [rotationSlotState, setRotationSlotState] = useState(() =>
    getRotationSlotState(0, visibleCardCount),
  )
  const { length: cardLength, height: cardHeight } = getMobiusCardDimensions(visibleCardCount)

  const selectCard = ({ slotIndex, mesh, item, texture }: MobiusCardSelection) => {
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute
    const sourcePositions = new Float32Array(position.count * 3)
    const point = new THREE.Vector3()

    mesh.updateWorldMatrix(true, false)

    for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
      point.fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.matrixWorld)
      sourcePositions[vertexIndex * 3] = point.x
      sourcePositions[vertexIndex * 3 + 1] = point.y
      sourcePositions[vertexIndex * 3 + 2] = point.z
    }

    selectionPhaseRef.current = 'selecting'
    selectionProgressRef.current = 0
    setSelection({ slotIndex, item, texture, sourcePositions })
    onSelectionDisplayChange({ item, visible: true })
  }

  const deselectCard = () => {
    if (selectionPhaseRef.current !== 'idle') {
      selectionPhaseRef.current = 'deselecting'

      if (selection) {
        onSelectionDisplayChange({ item: selection.item, visible: false })
      }
    }
  }

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime()

    if (carouselRef.current) {
      carouselRef.current.rotation.set(
        Math.cos(elapsed / 4) / 16,
        Math.sin(elapsed / 3) / 12,
        Math.sin(elapsed / 2) / 24,
      )
      carouselRef.current.position.y = Math.cos(elapsed / 2) / 12
    }

    if (parallaxRef.current) {
      const pointerRotationEnabled = selection === null
      const targetRotationX = pointerRotationEnabled
        ? BASE_RIG_ROTATION_X + state.pointer.y * POINTER_ROTATION_X
        : BASE_RIG_ROTATION_X
      const targetRotationY = pointerRotationEnabled
        ? BASE_RIG_ROTATION_Y - state.pointer.x * POINTER_ROTATION_Y
        : BASE_RIG_ROTATION_Y

      parallaxRef.current.rotation.x = THREE.MathUtils.damp(
        parallaxRef.current.rotation.x,
        targetRotationX,
        POINTER_ROTATION_DAMPING,
        delta,
      )
      parallaxRef.current.rotation.y = THREE.MathUtils.damp(
        parallaxRef.current.rotation.y,
        targetRotationY,
        POINTER_ROTATION_DAMPING,
        delta,
      )
    }

    if (
      selection &&
      (selectionPhaseRef.current === 'selecting' || selectionPhaseRef.current === 'selected')
    ) {
      const selectedMidCoord = selection.slotIndex / visibleCardCount
      const targetOffset = FRONT_PHASE - selectedMidCoord

      targetRotationRef.current =
        currentRotationRef.current + getShortestPhaseDelta(currentRotationRef.current, targetOffset)
    }

    currentRotationRef.current = THREE.MathUtils.damp(
      currentRotationRef.current,
      targetRotationRef.current,
      SELECTION_OFFSET_DAMPING,
      delta,
    )

    const normalizedRotation = THREE.MathUtils.euclideanModulo(currentRotationRef.current, 1)
    const nextRotationSlotState = getRotationSlotState(currentRotationRef.current, visibleCardCount)

    displayOffsetRef.current = normalizedRotation

    if (
      nextRotationSlotState.fullTurns !== rotationSlotState.fullTurns ||
      nextRotationSlotState.crossedSlotCount !== rotationSlotState.crossedSlotCount
    ) {
      setRotationSlotState(nextRotationSlotState)
    }

    if (!selection) {
      selectionProgressRef.current = 0
    } else if (selectionPhaseRef.current === 'selecting') {
      selectionProgressRef.current = Math.min(
        1,
        selectionProgressRef.current + delta / SELECTION_DURATION,
      )

      if (selectionProgressRef.current === 1) {
        selectionPhaseRef.current = 'selected'
      }
    } else if (selectionPhaseRef.current === 'selected') {
      selectionProgressRef.current = 1
    } else if (selectionPhaseRef.current === 'deselecting') {
      selectionProgressRef.current = Math.max(
        0,
        selectionProgressRef.current - delta / DESELECTION_DURATION,
      )

      if (selectionProgressRef.current === 0) {
        selectionPhaseRef.current = 'idle'
        setSelection(null)
        onSelectionDisplayChange(null)
      }
    }

    state.events.update?.()
  })

  return (
    <>
      <mesh position={[0, 0, -3]} onClick={deselectCard}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={parallaxRef}>
        <group ref={carouselRef}>
          {Array.from({ length: visibleCardCount }, (_, slotIndex) => {
            const itemIndex = getSlotItemIndex(
              slotIndex,
              visibleCardCount,
              items.length,
              rotationSlotState,
            )
            const item = itemIndex === null ? null : items[itemIndex]

            if (!item) {
              return null
            }

            const texture = item.imageUrl
              ? (texturesByUrl.get(item.imageUrl) ?? texturelessTexture)
              : texturelessTexture

            return (
              <MobiusCarouselCard
                key={slotIndex}
                slotIndex={slotIndex}
                item={item}
                texture={texture}
                coord={slotIndex / visibleCardCount}
                length={cardLength}
                height={cardHeight}
                displayOffsetRef={displayOffsetRef}
                selectedSlotIndex={selection?.slotIndex ?? null}
                onSelect={selectCard}
                onDeselect={deselectCard}
              />
            )
          })}
        </group>
      </group>
      <SelectedCardTransition
        selection={selection}
        visibleCardCount={visibleCardCount}
        displayOffsetRef={displayOffsetRef}
        selectionPhaseRef={selectionPhaseRef}
        selectionProgressRef={selectionProgressRef}
        carouselRef={carouselRef}
        onDeselect={deselectCard}
      />
    </>
  )
}
