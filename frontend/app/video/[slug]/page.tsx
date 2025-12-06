'use client'
import { useParams } from 'next/navigation'
import style from './video.module.scss'
import Navbar2 from '@/src/components/Navbar2/Navbar2';

const Page = () => {
    const params = useParams();
    const src = params?.slug 
    const vediosrc = Array.isArray(src) ? src[0] : src;
    const videoUrl = vediosrc ? decodeURIComponent(vediosrc) : ''
    



  return (
    <div className={style.main}>
    <Navbar2/>
    <div className={style.container}>
        <div className={style.videocont}>
            <video autoPlay controls width={1000}>
                <source src={videoUrl}/>
            </video>
        </div>
        <div className={style.suggestcont}>
            <h1>Suggested videos</h1>
        </div>
    </div>
    </div>
  )
}

export default Page;