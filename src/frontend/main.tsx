import { createRoot } from 'react-dom/client'
import type { CarouselItem } from '../shared/carousel'
import { MobiusCarousel } from './MobiusCarousel'

interface CarouselPayload {
  items: CarouselItem[]
  visibleCardCount: number
  backgroundColor: string
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function isCarouselItem(value: unknown): value is CarouselItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    Number.isInteger(item.id) &&
    typeof item.title === 'string' &&
    isNullableString(item.imageUrl) &&
    typeof item.description === 'string' &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === 'string') &&
    isNullableString(item.destinationUrl)
  )
}

function parsePayload(value: string): CarouselPayload | null {
  try {
    const payload: unknown = JSON.parse(value)

    if (!payload || typeof payload !== 'object') {
      return null
    }

    const candidate = payload as Record<string, unknown>

    if (
      !Array.isArray(candidate.items) ||
      !candidate.items.every(isCarouselItem) ||
      typeof candidate.visibleCardCount !== 'number' ||
      typeof candidate.backgroundColor !== 'string'
    ) {
      return null
    }

    return {
      items: candidate.items,
      visibleCardCount: candidate.visibleCardCount,
      backgroundColor: candidate.backgroundColor,
    }
  } catch {
    return null
  }
}

for (const container of document.querySelectorAll<HTMLElement>('[data-mobius-carousel]')) {
  if (container.dataset.mobiusCarouselMounted === 'true') {
    continue
  }

  const dataElement = container.querySelector<HTMLScriptElement>('script[type="application/json"]')
  const payload = dataElement ? parsePayload(dataElement.textContent) : null

  container.dataset.mobiusCarouselMounted = 'true'

  if (!payload) {
    container.textContent = 'The carousel data could not be loaded.'
    continue
  }

  createRoot(container).render(
    <MobiusCarousel
      items={payload.items}
      visibleCardCount={payload.visibleCardCount}
      backgroundColor={payload.backgroundColor}
    />,
  )
}
