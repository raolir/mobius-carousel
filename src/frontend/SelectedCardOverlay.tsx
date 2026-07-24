import { motion } from 'motion/react'
import type { CarouselItem } from '../shared/carousel'

const textContainerVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
  show: {
    opacity: 1,
    height: 'auto',
    transition: { when: 'beforeChildren', staggerChildren: 0.06 },
  },
}

const textItemVariants = {
  hidden: { opacity: 0, y: '100%' },
  show: { opacity: 1, y: 0 },
}

interface SelectedCardOverlayProps {
  item: CarouselItem | null
  visible: boolean
}

export function SelectedCardOverlay({ item, visible }: SelectedCardOverlayProps) {
  if (!item) {
    return null
  }

  return (
    <aside
      className={`mobius-carousel__selection-info${visible ? ' is-visible' : ''}`}
      aria-hidden={!visible}
    >
      <motion.ul
        className="mobius-carousel__selection-list"
        variants={textContainerVariants}
        initial="hidden"
        animate={visible ? 'show' : 'hidden'}
      >
        <li>
          <motion.div variants={textItemVariants}>
            <h2>
              {item.title}
              <span className="mobius-carousel__selection-accent">.</span>
            </h2>
          </motion.div>
        </li>
        {item.tags.length > 0 && (
          <li>
            <motion.ul className="mobius-carousel__tag-list" variants={textItemVariants}>
              {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </motion.ul>
          </li>
        )}
        {item.description && (
          <li>
            <motion.div variants={textItemVariants}>
              <p className="mobius-carousel__description">{item.description}</p>
            </motion.div>
          </li>
        )}
        {item.destinationUrl && (
          <li>
            <motion.div variants={textItemVariants}>
              <a
                className="mobius-carousel__action"
                href={item.destinationUrl}
                onPointerDown={(event) => {
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                Open
              </a>
            </motion.div>
          </li>
        )}
      </motion.ul>
    </aside>
  )
}
