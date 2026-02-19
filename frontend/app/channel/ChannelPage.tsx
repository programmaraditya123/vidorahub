"use client";

import { useEffect, useState } from "react";
import styles from "../profile/Profile.module.scss";
import ProfileCard from "@/src/components/ProfilePage/ProfileCard";
import Tabs from "@/src/components/ProfilePage/Tabs";
import Sidebar from "@/src/components/ProfilePage/Sidebar";
import Footer from "@/src/components/ProfilePage/Footer";
import { creatorchannel } from "@/src/lib/video/videodata";
import Sidebar1 from "@/src/components/HomePage/Sidebar/Sidebar";
import MasonryGrid2 from "@/src/components/ChannelPage/MassonaryGrid2";
import Navbar2 from "@/src/components/Navbar2/Navbar2";
import style from "./channel.module.scss";

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

interface ChannelPageProps {
  id: string;
}

export default function ChannelPage({ id }: ChannelPageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [uploads, setUploads] = useState<UploadVideo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res: CreatorProfileResponse = await creatorchannel(id);

      const publicUploads = res.data.uploads;

      setProfileData(res.data);
      setUploads(publicUploads);
    };

    fetchData();
  }, [id]);

  if (!profileData) return <div>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.backdrop}>
        <div className={styles.backdropOverlay}></div>
        <div className={styles.backdropImage} />
      </div>

      {/* <div className={styles.hiddenSideBar}> */}
        <Sidebar1 />
      {/* </div> */}

      <Navbar2 />

      <div className={styles.container}>
        {/* <Header /> */}

        <div className={style.setting}>
          <main className={styles.main}>
            <section className={styles.content}>
              <ProfileCard data={profileData} />
              <Tabs />
              {/* <MassonaryGrid uploads={uploads} /> */}
              <MasonryGrid2 uploads={uploads} />
            </section>

            <Sidebar />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
