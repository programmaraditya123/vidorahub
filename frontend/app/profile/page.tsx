"use client";

import { useEffect, useState } from "react";
import Header from "@/src/components/ProfilePage/Header";
import styles from "./Profile.module.scss";
import ProfileCard from "@/src/components/ProfilePage/ProfileCard";
import Tabs from "@/src/components/ProfilePage/Tabs";
import MasonryGrid from "@/src/components/ProfilePage/MasonryGrid";
import Sidebar from "@/src/components/ProfilePage/Sidebar";
import Footer from "@/src/components/ProfilePage/Footer";
import { getCreatorProfileData } from "@/src/lib/video/videodata";
import Sidebar1 from "@/src/components/HomePage/Sidebar/Sidebar";
import VidoraHubLoader from "@/src/components/ui/VidoraHubLoader/VidoraHubLoader";

type VideoStats = {
  views: number;
};

type UploadVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  visibility: "public" | "private";
  videoUrl: string;
  createdAt: string;
  stats: VideoStats;
};

type ProfileData = {
  _id: string;
  name: string;
  subscriber: number;
  creator: boolean;
  totalviews: number;
  totalvideos: number;
  uploads: UploadVideo[];
  role: number;
  createdAt: string;
  updatedAt: string;
};

type CreatorProfileResponse = {
  success: boolean;
  message: string;
  data: ProfileData;
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [uploads, setUploads] = useState<UploadVideo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res: CreatorProfileResponse = await getCreatorProfileData();

      const publicUploads = res.data.uploads
      

      setProfileData(res.data);
      setUploads(publicUploads);
    };

    fetchData();
  }, []);

  // if (!profileData) return <div><VidoraHubLoader/></div>;

  return (
    <div className={styles.page}>
      <div className={styles.backdrop}>
        <div className={styles.backdropOverlay}></div>
        <div className={styles.backdropImage} />
      </div>
       
       {/* <div className={styles.hiddenSideBar}> */}
      <Sidebar1/>
       {/* </div> */}


      <div className={styles.container}>
        <Header />

        <main className={styles.main}>
          {!profileData ? <VidoraHubLoader/> : (<section className={styles.content}>
            <ProfileCard data={profileData} />
            <Tabs />
            <MasonryGrid uploads={uploads} />
          </section>)}
          
          <div>
            <Sidebar />
          </div>
          
        </main>

        
      <Footer />
      </div>
    </div>
  );
}
