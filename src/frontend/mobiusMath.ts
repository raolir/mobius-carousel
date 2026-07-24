import * as THREE from 'three'

const MOBIUS_ANGLE_OFFSET = THREE.MathUtils.degToRad(10)
const MOBIUS_ENDPOINT_TWIST_WIDTH = 0.16
const MOBIUS_CARD_LENGTH_RATIO = 0.88

export interface MobiusCardDimensions {
  length: number
  height: number
}

export function getMobiusCardDimensions(visibleCardCount: number): MobiusCardDimensions {
  const length = MOBIUS_CARD_LENGTH_RATIO / visibleCardCount

  return {
    length,
    height: length * Math.PI * 2,
  }
}

export function getShortestPhaseDelta(from: number, to: number): number {
  return THREE.MathUtils.euclideanModulo(to - from + 0.5, 1) - 0.5
}

export function writeMobiusPoint(
  target: THREE.Vector3,
  coord: number,
  length: number,
  height: number,
  offset: number,
  u: number,
  v: number,
): THREE.Vector3 {
  const circularCoord = coord + offset + (0.5 - u) * length
  const circularPhase = THREE.MathUtils.euclideanModulo(circularCoord, 1)
  const baseAngle = circularCoord * Math.PI * 2
  const angle = baseAngle + MOBIUS_ANGLE_OFFSET
  const amplitude = 0.3 + Math.cos(baseAngle) * 0.1
  const centerX = Math.sin(angle)
  const centerY = Math.sin(angle * 2) * amplitude
  const centerZ = -Math.cos(angle)
  const startTwist = 1 - THREE.MathUtils.smoothstep(circularPhase, 0, MOBIUS_ENDPOINT_TWIST_WIDTH)
  const endTwist = -THREE.MathUtils.smoothstep(circularPhase, 1 - MOBIUS_ENDPOINT_TWIST_WIDTH, 1)
  const twist = (startTwist + endTwist) * Math.PI * 0.5
  const crossSectionOffset = (v - 0.5) * height
  const tangentX = Math.cos(angle)
  const tangentZ = Math.sin(angle)

  return target.set(
    centerX - tangentZ * Math.sin(twist) * crossSectionOffset,
    centerY + Math.cos(twist) * crossSectionOffset,
    centerZ + tangentX * Math.sin(twist) * crossSectionOffset,
  )
}
