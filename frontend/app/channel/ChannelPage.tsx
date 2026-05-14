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
import ProductCard from "@/src/components/ChannelPage/ProductCard/ProductCard";
import { useSearchParams } from "next/navigation";

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

type Platform = {
  _id?: string;
  platform: string;
  url: string;
  audience: number;
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
  bio?: string;
  profilePicUrl?: string;
  platforms?: Platform[];
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
  // const [activeTab, setActiveTab] = useState("videos");
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "videos";

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
      <div className={styles.topNav}>
        <Navbar2 />
      </div>

      <div className={styles.container}>
        {/* <Header /> */}

        <div className={style.setting}>
          <main className={styles.main}>
            <section className={styles.content}>
              <ProfileCard data={profileData} />
              <Tabs channelId={id} />
              {/* <MassonaryGrid uploads={uploads} /> */}
              {activeTab === "videos" && <MasonryGrid2 uploads={uploads} />}
              {activeTab === "store" && (
                <div className={styles.wrapper}>
                  <ProductCard
                    products={[
                      {
                        id: "1",
                        title: "Tape Winter Coat",
                        category: "Premium Winter Collection",
                        size: "M",
                        stock: "In Stock",
                        updatedAt: "2 days ago",
                        description:
                          "This is the best jacket you have seen in the world with premium quality fabric and luxury comfort.",
                        price: 2350,
                        oldPrice: 3999,
                        image:
                          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop",
                      },

                      {
                        id: "2",
                        title: "Oversized Hoodie",
                        category: "Streetwear Fashion",
                        size: "L",
                        stock: "Limited",
                        updatedAt: "5 hours ago",
                        description:
                          "Premium oversized hoodie with ultra soft fabric and aesthetic fit.",
                        price: 1899,
                        oldPrice: 2599,
                        image:
                          "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=400&auto=format&fit=crop",
                      },
                    ]}
                  />
                </div>
              )}
            </section>

            <Sidebar
              bio={profileData?.bio}
              platforms={profileData?.platforms}
            />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
