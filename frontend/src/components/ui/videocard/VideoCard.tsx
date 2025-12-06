'use client'

import Image from 'next/image'
import style from './VideoCard.module.scss'
import th from './abc.png'
import { getVideos } from '@/src/lib/video/uploadvideo'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


type Video = {
  _id: string;
  title: string;
  description : string;
  creatorName?: string;
  videoUrl?: string;
};


const VideoCard = () => {
  const [videos,setVideos] = useState<Video[]>([])
  const [loading,setLoading] = useState<boolean>(true)
  const router  = useRouter();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos()
        console.log("************",data)
        setVideos(data.data.items ?? [])
      } catch (error) {
        console.log(error,"Error in loading videos")
        
      }finally{
        setLoading(false)
      }
    }
    fetchVideos();
  },[])

  const handleNavigate = (url:string) => {
    router.push(`/video/${encodeURIComponent(url)}`)

  }

  if (loading) {
    return <div className={style.container}>Loading...</div>;
     }
  
  return (
    <div className={style.cards}>
    {videos.map((videos)=> (
      <div className={style.container} key={videos._id} onClick={() => {handleNavigate(`${videos.videoUrl}`)}}>
        <div className={style.imgcont}>
            <Image src={th} height={140} width={286} alt='Thumbnail' quality={75}/>
        </div>
        <div className={style.userinfo}>
            <div className={style.userimg}>
              <Image src={th} height={32} width={32} alt='profile' quality={75}/>
            </div>
            <div className={style.videotitle}>
              <p>{videos.title}</p>
              <h3 className={style.creatorname}>Aditya</h3>
              <h3 className={style.views}>1.2M views</h3>
            </div>
        </div>
    </div>

    ))}
    </div>
    
  )
}

export default VideoCard