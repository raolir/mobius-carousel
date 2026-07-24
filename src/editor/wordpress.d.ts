import type { ComponentType, HTMLAttributes } from 'react'

interface MobiusCarouselBlockAttributes {
  categoryId: number
  visibleCardCount: number
  backgroundColor: string
}

interface MobiusCarouselBlockEditProps {
  attributes: MobiusCarouselBlockAttributes
  setAttributes: (attributes: Partial<MobiusCarouselBlockAttributes>) => void
}

interface WordPressCategoryRecord {
  id: number
  name: string
}

type WordPressComponent = ComponentType<Record<string, unknown>>

interface WordPressCoreDataSelectors {
  getEntityRecords: (
    kind: 'taxonomy',
    name: 'category',
    query: Record<string, string | number | boolean>,
  ) => WordPressCategoryRecord[] | null
}

interface WordPressGlobals {
  blocks: {
    registerBlockType: (name: string, settings: Record<string, unknown>) => void
  }
  blockEditor: {
    InspectorControls: WordPressComponent
    useBlockProps: () => HTMLAttributes<HTMLDivElement>
  }
  components: {
    BaseControl: WordPressComponent
    ColorPicker: WordPressComponent
    PanelBody: WordPressComponent
    Placeholder: WordPressComponent
    SelectControl: WordPressComponent
    TextControl: WordPressComponent
  }
  data: {
    useSelect: <T>(
      mapSelect: (select: (storeName: 'core') => WordPressCoreDataSelectors) => T,
      dependencies: readonly unknown[],
    ) => T
  }
  element: {
    createElement: typeof import('react').createElement
    Fragment: typeof import('react').Fragment
  }
  i18n: {
    __: (text: string, domain: string) => string
    sprintf: (format: string, ...values: Array<string | number>) => string
  }
}

declare global {
  interface Window {
    wp: WordPressGlobals
  }
}

export type { MobiusCarouselBlockEditProps, WordPressCategoryRecord }
