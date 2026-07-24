import metadata from '../../wordpress-plugin/block/block.json'
import {
  DEFAULT_CAROUSEL_BACKGROUND_COLOR,
  DEFAULT_VISIBLE_CARD_COUNT,
  normalizeCarouselBackgroundColor,
  normalizeVisibleCardCount,
} from '../shared/carousel'
import type { MobiusCarouselBlockEditProps } from './wordpress'
import './styles.css'

const { registerBlockType } = window.wp.blocks
const { InspectorControls, useBlockProps } = window.wp.blockEditor
const { BaseControl, ColorPicker, PanelBody, Placeholder, SelectControl, TextControl } =
  window.wp.components
const { useSelect } = window.wp.data
const { createElement, Fragment } = window.wp.element
const { __, sprintf } = window.wp.i18n

function Edit({ attributes, setAttributes }: MobiusCarouselBlockEditProps) {
  const blockProps = useBlockProps()
  const categories = useSelect(
    (select) =>
      select('core').getEntityRecords('taxonomy', 'category', {
        per_page: 100,
        hide_empty: false,
        orderby: 'name',
        order: 'asc',
      }),
    [],
  )
  const selectedCategory = categories?.find((category) => category.id === attributes.categoryId)
  const categoryOptions = [
    { label: __('Choose a category', 'mobius-carousel'), value: '0' },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
  ]

  return createElement(
    Fragment,
    null,
    createElement(
      InspectorControls,
      null,
      createElement(
        PanelBody,
        {
          title: __('Möbius Carousel settings', 'mobius-carousel'),
          initialOpen: true,
        },
        createElement(SelectControl, {
          label: __('Post category', 'mobius-carousel'),
          value: String(attributes.categoryId),
          options: categoryOptions,
          disabled: categories === null,
          onChange: (value: string) => {
            const categoryId = Number(value)
            setAttributes({
              categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : 0,
            })
          },
        }),
        createElement(TextControl, {
          label: __('Visual card count', 'mobius-carousel'),
          type: 'number',
          min: 1,
          step: 1,
          value: String(attributes.visibleCardCount),
          onChange: (value: string) => {
            setAttributes({ visibleCardCount: normalizeVisibleCardCount(Number(value)) })
          },
        }),
        createElement(
          BaseControl,
          { label: __('Background color', 'mobius-carousel') },
          createElement(ColorPicker, {
            color: attributes.backgroundColor,
            enableAlpha: false,
            onChange: (value: string) => {
              setAttributes({ backgroundColor: normalizeCarouselBackgroundColor(value) })
            },
          }),
        ),
      ),
    ),
    createElement(
      'div',
      blockProps,
      createElement(
        Placeholder,
        {
          className: 'mobius-carousel-editor__placeholder',
          icon: metadata.icon,
          label: metadata.title,
        },
        createElement(
          'p',
          null,
          selectedCategory
            ? sprintf(__('Category: %s', 'mobius-carousel'), selectedCategory.name)
            : __('Choose a post category in the block settings.', 'mobius-carousel'),
        ),
        createElement(
          'p',
          null,
          sprintf(
            __('Visual cards: %s', 'mobius-carousel'),
            normalizeVisibleCardCount(attributes.visibleCardCount),
          ),
        ),
      ),
    ),
  )
}

registerBlockType(metadata.name, {
  apiVersion: metadata.apiVersion,
  title: metadata.title,
  category: metadata.category,
  icon: metadata.icon,
  description: metadata.description,
  supports: metadata.supports,
  attributes: {
    ...metadata.attributes,
    visibleCardCount: {
      ...metadata.attributes.visibleCardCount,
      default: DEFAULT_VISIBLE_CARD_COUNT,
    },
    backgroundColor: {
      ...metadata.attributes.backgroundColor,
      default: DEFAULT_CAROUSEL_BACKGROUND_COLOR,
    },
  },
  edit: Edit,
  save: () => null,
})

export { Edit }
