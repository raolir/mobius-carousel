import { createRoot } from 'react-dom/client'
import { MobiusCarousel } from '../frontend/MobiusCarousel'
import { DEFAULT_CAROUSEL_BACKGROUND_COLOR } from '../shared/carousel'
import { mockItems } from './mockItems'
import './styles.css'

const rootElement = document.querySelector<HTMLElement>('#root')

if (!rootElement) {
  throw new Error('The demo root element is missing.')
}

createRoot(rootElement).render(
  <MobiusCarousel
    items={mockItems}
    visibleCardCount={7}
    backgroundColor={DEFAULT_CAROUSEL_BACKGROUND_COLOR}
  />,
)
