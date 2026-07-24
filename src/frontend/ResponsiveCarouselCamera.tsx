import { PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const SQUARE_FIELD_OF_VIEW = 12

export function ResponsiveCarouselCamera() {
  const { width, height } = useThree((state) => state.size)
  const aspectRatio = height > 0 ? width / height : 1
  const squareFieldOfView = THREE.MathUtils.degToRad(SQUARE_FIELD_OF_VIEW)
  const portraitFieldOfView = THREE.MathUtils.radToDeg(
    2 * Math.atan(Math.tan(squareFieldOfView / 2) / aspectRatio),
  )

  return (
    <PerspectiveCamera
      makeDefault
      position={[0, 0, 10]}
      fov={Math.max(SQUARE_FIELD_OF_VIEW, portraitFieldOfView)}
      near={0.1}
      far={50}
    />
  )
}
