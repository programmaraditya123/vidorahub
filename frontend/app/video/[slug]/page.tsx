'use client'
import { useParams } from 'next/navigation'
import style from './video.module.scss'
import Navbar2 from '@/src/components/Navbar2/Navbar2';
import VideoMetaBar from '@/src/components/shared/videometabar/VideoMetaBar';
import ResourcesCard from '@/src/components/shared/resourcescard/ResourcesCard';
import UpNextSidebar from '@/src/components/shared/upnextsidebar/UpNextSidebar';
import VideoDescription from '@/src/components/ui/videodiscription/VideoDiscription';
import CommentsSection from '@/src/components/ui/CommentSection/CommentSection';
import { decodeFilename } from '@/src/functions';

const Page = () => {
    const params = useParams();
    const src = params?.slug 
    const vediosrc = Array.isArray(src) ? src[0] : src;
    const videoUrl = vediosrc ? decodeURIComponent(vediosrc) : ''
    const decoded = decodeFilename(videoUrl)
    const url = `https://storage.googleapis.com/vidorahub/${decoded}`
    // console.log(url,"***************")
    



  return (
    <div className={style.main}>
    <Navbar2/>
    <div className={style.container}>
        <div className={style.videocont}>
            <video autoPlay controls width={1000} height={420}>
                <source src={url}/>
            </video>
            <VideoMetaBar
                title="How to Design a Modern UI in 2024: Complete Masterclass"
                channelName="UI Mastery"
                channelImage="/channel.png"
                subscribers="1.2M"
                />
                <VideoDescription
                    views="2,458,123"
                    uploaded="2 weeks ago"
                    hashtags={['UIDesign', 'UXDesign', 'Frontend']}
                    description={`A deep dive into the principles of modern UI/UX design for 2024.
                    We cover topics like minimalism, color theory, typography, and creating accessible interfaces that users love.

                    This is part 1 of a 3 part series on mastering frontend design.`}
                    />

                    <CommentsSection
                            totalComments={342}
                            comments={[
                                {
                                id: '1',
                                user: 'Alex Johnson',
                                avatar: '/u1.jpg',
                                text:
                                    'This is exactly what I was looking for! The section on typography was a game-changer for my current project.',
                                likes: 42,
                                time: '1 week ago'
                                },
                                {
                                id: '2',
                                user: 'Maria Garcia',
                                avatar: '/u2.jpg',
                                text:
                                    'Great tutorial! I’d love to see a follow-up on creating design systems.',
                                likes: 18,
                                time: '6 days ago'
                                },
                                {
                                id: '3',
                                user: 'UI Mastery',
                                avatar: '/u3.jpg',
                                text:
                                    'Thanks, Maria! That’s a fantastic idea. I’ll add it to my list for an upcoming video. Stay tuned!',
                                likes: 11,
                                time: '5 days ago',
                                isCreator: true
                                }
                            ]}
                            />


        </div>
        <div className={style.suggestcont}>
            <ResourcesCard
                onDownload={() => {
                    console.log('Download notes')
                }}
                />

                    <UpNextSidebar
        autoplay={true}
        videos={[
            {
            id: '1',
            title: 'The Ultimate Guide to CSS Grid Layouts',
            channel: 'CodeCraft',
            views: '1.2M',
            uploaded: '3 days ago',
            duration: '12:34',
            thumbnail: '/th'
            },
            {
            id: '2',
            title: '5 UI Design Trends to Watch in 2024',
            channel: 'PixelPerfect',
            views: '800K',
            uploaded: '1 week ago',
            duration: '8:05',
            thumbnail: '/th'
            }
        ]}
        />

        


        </div>
    </div>
    </div>
  )
}

export default Page;