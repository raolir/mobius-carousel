export interface CarouselItem {
  id: number
  title: string
  imageUrl: string | null
  description: string
  tags: string[]
  destinationUrl: string | null
}

export const DEFAULT_VISIBLE_CARD_COUNT = 7
export const DEFAULT_CAROUSEL_BACKGROUND_COLOR = '#667889'

export function normalizeVisibleCardCount(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_VISIBLE_CARD_COUNT
}

export function normalizeCarouselBackgroundColor(value: string): string {
  return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : DEFAULT_CAROUSEL_BACKGROUND_COLOR
}
