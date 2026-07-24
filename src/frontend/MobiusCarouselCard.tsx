import { useRef, useState, type RefObject } from 'react'
import { Image } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarouselItem } from '../shared/carousel'
import { writeMobiusPoint } from './mobiusMath'

const CARD_RADIUS = 0.1
const CARD_HOVER_RADIUS = 0.3
const CARD_HOVER_ZOOM = 1.25
const CARD_HOVER_SCALE = 1.025
const CARD_HOVER_DAMPING = 8

type ImageMaterial = THREE.ShaderMaterial & {
  radius: number
  zoom: number
}

export interface MobiusCardSelection {
  slotIndex: number
  mesh: THREE.Mesh
  item: CarouselItem
  texture: THREE.Texture
}

interface MobiusCarouselCardProps {
  slotIndex: number
  item: CarouselItem
  texture: THREE.Texture
  coord: number
  length: number
  height: number
  displayOffsetRef: RefObject<number>
  selectedSlotIndex: number | null
  onSelect: (selection: MobiusCardSelection) => void
  onDeselect: () => void
}

export function MobiusCarouselCard({
  slotIndex,
  item,
  texture,
  coord,
  length,
  height,
  displayOffsetRef,
  selectedSlotIndex,
  onSelect,
  onDeselect,
}: MobiusCarouselCardProps) {
  const imageRef = useRef<THREE.Mesh>(null)
  const point = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    const image = imageRef.current

    if (!image) {
      return
    }

    const activeHover = hovered && selectedSlotIndex === null
    const geometry = image.geometry
    const position = geometry.attributes.position as THREE.BufferAttribute
    const uv = geometry.attributes.uv as THREE.BufferAttribute

    for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
      writeMobiusPoint(
        point.current,
        coord,
        length,
        height,
        displayOffsetRef.current,
        uv.getX(vertexIndex),
        uv.getY(vertexIndex),
      )
      position.setXYZ(vertexIndex, point.current.x, point.current.y, point.current.z)
    }

    position.needsUpdate = true
    geometry.computeBoundingSphere()

    const material = image.material as ImageMaterial
    const scale = THREE.MathUtils.damp(
      image.scale.x,
      activeHover ? CARD_HOVER_SCALE : 1,
      CARD_HOVER_DAMPING,
      delta,
    )

    image.scale.setScalar(scale)
    material.radius = THREE.MathUtils.damp(
      material.radius,
      activeHover ? CARD_HOVER_RADIUS : CARD_RADIUS,
      CARD_HOVER_DAMPING,
      delta,
    )
    material.zoom = THREE.MathUtils.damp(
      material.zoom,
      activeHover ? CARD_HOVER_ZOOM : 1,
      CARD_HOVER_DAMPING,
      delta,
    )
  })

  return (
    <Image
      ref={imageRef}
      texture={texture}
      scale={[1, 1]}
      radius={CARD_RADIUS}
      zoom={1}
      transparent
      side={THREE.DoubleSide}
      visible={selectedSlotIndex !== slotIndex}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => {
        setHovered(false)
      }}
      onClick={(event) => {
        event.stopPropagation()

        if (selectedSlotIndex !== null) {
          onDeselect()
          return
        }

        if (hovered && imageRef.current) {
          onSelect({ slotIndex, mesh: imageRef.current, item, texture })
        }
      }}
    >
      <planeGeometry args={[1, 1, 100, 10]} />
    </Image>
  )
}
