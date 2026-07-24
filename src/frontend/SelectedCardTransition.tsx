import { useRef, type RefObject } from 'react'
import { Image, MeshTransmissionMaterial, useFBO } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarouselItem } from '../shared/carousel'
import { getMobiusCardDimensions, writeMobiusPoint } from './mobiusMath'

const CARD_RADIUS = 0.1
const CARD_HOVER_RADIUS = 0.3
const CARD_SELECTED_RADIUS = 0.03
const CARD_HOVER_ZOOM = 1.25
const SELECTED_CARD_CAMERA_DISTANCE = 5
const SELECTED_CARD_LEFT_OFFSET = 0.25
const SELECTED_CARD_UPPER_OFFSET = 0.25
const SELECTED_CARD_SIZE = 0.58
const FROSTED_GLASS_CAMERA_DISTANCE = SELECTED_CARD_CAMERA_DISTANCE + 0.35
const FROSTED_GLASS_CLOSED_SCALE = 0.01
const FROSTED_GLASS_OPEN_SCALE = 4
const CAROUSEL_LAYER = 0
const SELECTED_CARD_LAYER = 1
const FROSTED_GLASS_LAYER = 2

type ImageMaterial = THREE.ShaderMaterial & {
  radius: number
  zoom: number
}

export type SelectionPhase = 'idle' | 'selecting' | 'selected' | 'deselecting'

export interface SelectedCardState {
  slotIndex: number
  item: CarouselItem
  texture: THREE.Texture
  sourcePositions: Float32Array
}

interface SelectedCardTransitionProps {
  selection: SelectedCardState | null
  visibleCardCount: number
  displayOffsetRef: RefObject<number>
  selectionPhaseRef: RefObject<SelectionPhase>
  selectionProgressRef: RefObject<number>
  carouselRef: RefObject<THREE.Group | null>
  onDeselect: () => void
}

export function SelectedCardTransition({
  selection,
  visibleCardCount,
  displayOffsetRef,
  selectionPhaseRef,
  selectionProgressRef,
  carouselRef,
  onDeselect,
}: SelectedCardTransitionProps) {
  const imageRef = useRef<THREE.Mesh>(null)
  const selectedCardAnchorRef = useRef(new THREE.Vector3())
  const sourcePoint = useRef(new THREE.Vector3())
  const targetPoint = useRef(new THREE.Vector3())
  const anchorSourcePoint = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3())
  const { length: cardLength, height: cardHeight } = getMobiusCardDimensions(visibleCardCount)

  useFrame((state) => {
    const image = imageRef.current

    if (!image || !selection) {
      return
    }

    state.camera.layers.enable(SELECTED_CARD_LAYER)
    state.camera.layers.enable(FROSTED_GLASS_LAYER)
    image.layers.set(SELECTED_CARD_LAYER)

    const geometry = image.geometry
    const position = geometry.attributes.position as THREE.BufferAttribute
    const uv = geometry.attributes.uv as THREE.BufferAttribute
    const progress = THREE.MathUtils.smoothstep(selectionProgressRef.current, 0, 1)

    center.current
      .copy(state.camera.position)
      .addScaledVector(
        state.camera.getWorldDirection(forward.current),
        SELECTED_CARD_CAMERA_DISTANCE,
      )

    const viewport = state.viewport.getCurrentViewport(state.camera, center.current)
    const stackedLayout = state.size.width <= state.size.height
    const cardSize = stackedLayout
      ? Math.min(viewport.width * 0.75, viewport.height * 0.4)
      : Math.min(viewport.height * SELECTED_CARD_SIZE, viewport.width * 0.45)

    right.current.setFromMatrixColumn(state.camera.matrixWorld, 0).normalize()
    up.current.setFromMatrixColumn(state.camera.matrixWorld, 1).normalize()

    if (stackedLayout) {
      center.current.addScaledVector(up.current, viewport.height * SELECTED_CARD_UPPER_OFFSET)
    } else {
      center.current.addScaledVector(right.current, -viewport.width * SELECTED_CARD_LEFT_OFFSET)
    }

    carouselRef.current?.updateWorldMatrix(true, false)

    if (selectionPhaseRef.current !== 'deselecting') {
      anchorSourcePoint.current.set(0, 0, 0)

      for (let sourceIndex = 0; sourceIndex < selection.sourcePositions.length; sourceIndex += 3) {
        anchorSourcePoint.current.x += selection.sourcePositions[sourceIndex] ?? 0
        anchorSourcePoint.current.y += selection.sourcePositions[sourceIndex + 1] ?? 0
        anchorSourcePoint.current.z += selection.sourcePositions[sourceIndex + 2] ?? 0
      }

      anchorSourcePoint.current.multiplyScalar(3 / selection.sourcePositions.length)
    } else {
      writeMobiusPoint(
        anchorSourcePoint.current,
        selection.slotIndex / visibleCardCount,
        cardLength,
        cardHeight,
        displayOffsetRef.current,
        0.5,
        0.5,
      )
      anchorSourcePoint.current.applyMatrix4(
        carouselRef.current?.matrixWorld ?? new THREE.Matrix4(),
      )
    }

    selectedCardAnchorRef.current.copy(anchorSourcePoint.current).lerp(center.current, progress)

    for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
      const u = uv.getX(vertexIndex)
      const v = uv.getY(vertexIndex)

      if (selectionPhaseRef.current !== 'deselecting') {
        const sourceIndex = vertexIndex * 3
        sourcePoint.current.set(
          selection.sourcePositions[sourceIndex] ?? 0,
          selection.sourcePositions[sourceIndex + 1] ?? 0,
          selection.sourcePositions[sourceIndex + 2] ?? 0,
        )
      } else {
        writeMobiusPoint(
          sourcePoint.current,
          selection.slotIndex / visibleCardCount,
          cardLength,
          cardHeight,
          displayOffsetRef.current,
          u,
          v,
        )
        sourcePoint.current.applyMatrix4(carouselRef.current?.matrixWorld ?? new THREE.Matrix4())
      }

      targetPoint.current
        .copy(center.current)
        .addScaledVector(right.current, (u - 0.5) * cardSize)
        .addScaledVector(up.current, (v - 0.5) * cardSize)

      sourcePoint.current.lerp(targetPoint.current, progress)
      position.setXYZ(
        vertexIndex,
        sourcePoint.current.x,
        sourcePoint.current.y,
        sourcePoint.current.z,
      )
    }

    position.needsUpdate = true
    geometry.computeBoundingSphere()

    const material = image.material as ImageMaterial
    const sourceRadius =
      selectionPhaseRef.current === 'deselecting' ? CARD_RADIUS : CARD_HOVER_RADIUS
    const sourceZoom = selectionPhaseRef.current === 'deselecting' ? 1 : CARD_HOVER_ZOOM

    material.radius = THREE.MathUtils.lerp(sourceRadius, CARD_SELECTED_RADIUS, progress)
    material.zoom = THREE.MathUtils.lerp(sourceZoom, 1, progress)
    material.depthTest = false
    material.depthWrite = false
  })

  return (
    <>
      <FrostedGlassLayer
        selectionProgressRef={selectionProgressRef}
        selectedCardAnchorRef={selectedCardAnchorRef}
      />
      {selection && (
        <Image
          ref={imageRef}
          texture={selection.texture}
          scale={[1, 1]}
          radius={CARD_HOVER_RADIUS}
          zoom={CARD_HOVER_ZOOM}
          transparent
          side={THREE.DoubleSide}
          renderOrder={10}
          onClick={(event) => {
            event.stopPropagation()
            onDeselect()
          }}
        >
          <planeGeometry args={[1, 1, 100, 10]} />
        </Image>
      )}
    </>
  )
}

interface FrostedGlassLayerProps {
  selectionProgressRef: RefObject<number>
  selectedCardAnchorRef: RefObject<THREE.Vector3>
}

function FrostedGlassLayer({
  selectionProgressRef,
  selectedCardAnchorRef,
}: FrostedGlassLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const buffer = useFBO(512)
  const projectedAnchor = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3())

  useFrame((state) => {
    const mesh = meshRef.current

    if (!mesh) {
      return
    }

    state.camera.layers.enable(SELECTED_CARD_LAYER)
    state.camera.layers.enable(FROSTED_GLASS_LAYER)
    mesh.layers.set(FROSTED_GLASS_LAYER)

    const progress = THREE.MathUtils.smoothstep(selectionProgressRef.current, 0, 1)
    const visible = progress > 0.001

    mesh.visible = visible

    if (!visible) {
      return
    }

    center.current
      .copy(state.camera.position)
      .addScaledVector(
        state.camera.getWorldDirection(forward.current),
        FROSTED_GLASS_CAMERA_DISTANCE,
      )

    const viewport = state.viewport.getCurrentViewport(state.camera, center.current)
    const anchor = projectedAnchor.current.copy(selectedCardAnchorRef.current).project(state.camera)

    right.current.setFromMatrixColumn(state.camera.matrixWorld, 0).normalize()
    up.current.setFromMatrixColumn(state.camera.matrixWorld, 1).normalize()
    center.current
      .addScaledVector(right.current, (anchor.x * viewport.width) / 2)
      .addScaledVector(up.current, (anchor.y * viewport.height) / 2)

    mesh.position.copy(center.current)
    mesh.quaternion.copy(state.camera.quaternion)
    mesh.scale.setScalar(
      THREE.MathUtils.lerp(FROSTED_GLASS_CLOSED_SCALE, FROSTED_GLASS_OPEN_SCALE, progress),
    )

    const previousRenderTarget = state.gl.getRenderTarget()
    const previousLayerMask = state.camera.layers.mask

    state.camera.layers.set(CAROUSEL_LAYER)
    state.gl.setRenderTarget(buffer)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(previousRenderTarget)
    state.camera.layers.mask = previousLayerMask
    state.camera.layers.enable(CAROUSEL_LAYER)
    state.camera.layers.enable(SELECTED_CARD_LAYER)
    state.camera.layers.enable(FROSTED_GLASS_LAYER)
  })

  return (
    <mesh ref={meshRef} renderOrder={5}>
      <circleGeometry args={[1, 64]} />
      <MeshTransmissionMaterial
        buffer={buffer.texture}
        color="#f5f5f5"
        samples={16}
        resolution={512}
        anisotropicBlur={0.1}
        thickness={0.1}
        roughness={0.4}
        toneMapped={false}
      />
    </mesh>
  )
}
