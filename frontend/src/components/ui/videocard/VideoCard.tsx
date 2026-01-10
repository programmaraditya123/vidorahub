'use client'

import Image from 'next/image'
import style from './VideoCard.module.scss'
import th from './abc.png'
import { getVideos } from '@/src/lib/video/uploadvideo'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { encodeFilename } from '@/src/functions'

type Video = {
  _id: string
  title: string
  description: string
  creatorName?: string
  videoUrl?: string
  views?: string
  duration?: string
}

const VideoCard = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos()
        setVideos(data?.data?.items ?? [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const handleNavigate = useCallback(
    (url?: string) => {
      // console.log("original Url",url)
      const lastPart = url?.split('vidorahub/')[1];
      const encoded = encodeFilename(lastPart!)
      if (!url) return
      router.push(`/video/${encoded}`)
    },
    [router]
  )

  const videoCards = useMemo(() => {
    return videos.map((video) => (
      <div
        key={video._id}
        className={style.card}
        onClick={() => handleNavigate(video.videoUrl)}
      >
        {/* Thumbnail */}
        <div className={style.thumbnailWrapper}>
          <Image
            src={th}
            alt="Video thumbnail"
            fill
            className={style.thumbnail}
          />
          <span className={style.duration}>
            {video.duration ?? '12:45'}
          </span>
        </div>

        {/* Info */}
        <div className={style.info}>
          <Image
            src={th}
            height={36}
            width={36}
            alt="Creator"
            className={style.avatar}
          />

          <div className={style.meta}>
            <p className={style.title}>{video.title}</p>
            <span className={style.creator}>
              {video.creatorName ?? 'Aditya'}
            </span>
            <span className={style.views}>
              {video.views ?? '1.2M views'}
            </span>
          </div>
        </div>
      </div>
    ))
  }, [videos, handleNavigate])

  if (loading) {
    return <div className={style.loading}>Loading videos...</div>
  }

  return <div className={style.cards}>{videoCards}</div>
}

export default VideoCard
