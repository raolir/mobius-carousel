export interface RotationSlotState {
  fullTurns: number
  crossedSlotCount: number
}

function euclideanModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

export function getRotationSlotState(
  rotation: number,
  visibleCardCount: number,
): RotationSlotState {
  const normalizedRotation = euclideanModulo(rotation, 1)

  return {
    fullTurns: Math.floor(rotation),
    crossedSlotCount: Math.floor(normalizedRotation * visibleCardCount),
  }
}

export function getSlotItemIndex(
  slotIndex: number,
  visibleCardCount: number,
  itemCount: number,
  { fullTurns, crossedSlotCount }: RotationSlotState,
): number | null {
  if (itemCount === 0) {
    return null
  }

  const crossedOffset =
    crossedSlotCount > 0 && slotIndex >= visibleCardCount - crossedSlotCount ? visibleCardCount : 0

  return euclideanModulo(fullTurns * visibleCardCount - slotIndex + crossedOffset, itemCount)
}
