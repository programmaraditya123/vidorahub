'use client'
import { useParams } from 'next/navigation'
import style from './video.module.scss'
import Navbar2 from '@/src/components/Navbar2/Navbar2';

const page = () => {
    const params = useParams();
    console.log(params,"9999999999")
    const src = params?.slug 
    const vediosrc = src ? decodeURIComponent(src) : ""
    console.log(src,"333333333333")



  return (
    <div className={style.main}>
    <Navbar2/>
    <div className={style.container}>
        <div className={style.videocont}>
            <video autoPlay controls width={1000}>
                <source src={vediosrc}/>
            </video>
        </div>
        <div className={style.suggestcont}>
            <h1>Suggested videos</h1>
        </div>
    </div>
    </div>
  )
}

export default page