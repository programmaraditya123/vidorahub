'use client'

import styles from './ResourcesCard.module.scss'

type Props = {
  title?: string
  description?: string
  onDownload?: () => void
}

const ResourcesCard = ({
  title = 'Resources',
  description = 'Get the source files, slide deck, and additional notes for this lecture.',
  onDownload
}: Props) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <button className={styles.downloadBtn} onClick={onDownload}>
        ⬇ Download Notes
      </button>
    </div>
  )
}

export default ResourcesCard
