"use client";

import { useParams } from "next/navigation";
import styles from "./video.module.scss";
import Navbar2 from "@/src/components/Navbar2/Navbar2";
import { decodeFilename } from "@/src/functions";
import BackgroundLayers from "@/src/components/HomePage/BackgroundLayers/BackgroundLayers";
import UpNextSidebar from "@/src/components/shared/upnextsidebar/UpNextSidebar";
import VideoPlayer from "@/src/components/VideoPage/VideoPlayer/VideoPlayer";
import VideoMeta from "@/src/components/VideoPage/VideoMeta/VideoMeta";
import VideoActions from "@/src/components/VideoPage/VideoActions/VedioActions";
import VideoDescription from "@/src/components/VideoPage/VedioDescription/VideoDescription";
import ResourcesCard from "@/src/components/shared/resourcescard/ResourcesCard";
import CommentsSection from "@/src/components/ui/CommentSection/CommentSection";

export default function Page() {
  const params = useParams();
  const slug = params?.slug;
  const encoded = Array.isArray(slug) ? slug[0] : slug;

  const decoded = encoded ? decodeFilename(encoded) : "";
  const videoUrl = `https://storage.googleapis.com/vidorahub/${decoded}`;

  return (
    <div className={styles.page}>
      
      <BackgroundLayers />

      <Navbar2 />

      <div className={styles.layout}>
        
        <div className={styles.leftSidebar}>
          <UpNextSidebar
            autoplay={true}
            videos={[
              {
                id: "1",
                title: "The Ultimate Guide to CSS Grid Layouts",
                channel: "CodeCraft",
                views: "1.2M",
                uploaded: "3 days ago",
                duration: "12:34",
                thumbnail: "/th",
              },
              {
                id: "2",
                title: "5 UI Design Trends to Watch in 2024",
                channel: "PixelPerfect",
                views: "800K",
                uploaded: "1 week ago",
                duration: "8:05",
                thumbnail: "/th",
              },
            ]}
          />
        </div>

        <main className={styles.center}>
          
          <VideoPlayer src={videoUrl} />

          <div className={styles.topMeta}>
            <VideoMeta
              title="Lofi Beats for Deep Coding Sessions"
              category="Cinematic 4K"
              published="2 hours ago"
            />

            <VideoActions likes="42K" />
          </div>

          <div className={styles.resourcesRow}>
            <div>
              <VideoDescription
                views="2,458,123"
                uploaded="2 weeks ago"
                hashtags={["Lofi", "Beats", "CodingMusic"]}
                description={`Dive into the ultimate productivity atmosphere with our Lofi mix. Perfect
for deep coding sessions, debugging, creative design flow, and late-night
focus mode.

Includes exclusive underground tracks, ambient rain, soft pads, vintage synths, and a frequency-balanced mix designed to reduce cognitive fatigue.`}
              />
            </div>

            {/* <div>
              <ResourcesCard
                filename="Project_Assets.zip"
                size="24.5 MB • ZIP/PDF"
                onDownload={() => console.log("download zip")}
              />

              <div className={styles.licenseBox}>
                <span className="material-symbols-outlined">info</span>
                <p>CC BY-NC 4.0 International License Applied</p>
              </div>
            </div> */}
          </div>
        </main>

        {/* RIGHT SIDEBAR — COMMENTS */}
        <div className={styles.rightSidebar}>
          <CommentsSection
            totalComments={982}
            comments={[
              {
                id: "1",
                user: "@AlexChen",
                avatar:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-i_iUBYH3jBKnaaKXcgLdM6cvyxWBX0eWo_aip3s8luNWE_LC9s6ZaXGxHSlAUCs_ig-cdiEt9g-8wycdKuIKkPwg2BJQ30nVM3fK80XvP9U9IJ6rjDdUNNf9d8FhdDy8nEb0P7Lb7EO-cTes0z4ZSk-zkschdHe6qNNWFjb8LAogFAbph7AJb0-xQ_rhsJks-bMfoCuhXaVbAMgsrxd8eBTkQd0eBpFHvwSNKU3-cHgxKP2MzhG1OiPjR0xMSVzKr_wTNuchxtQe",
                text:
                  "The ambient glow effect on this player is absolutely insane. Best UI I've seen in years! 🚀",
                likes: 14,
                time: "2m ago",
              },
              {
                id: "2",
                user: "@SarahKnight",
                avatar:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBG7mXJsJKbi8MN-mCyFzYxE71yMhJVJFJVB6M86gWP4rQvWnVpCDIUogTjhS6-_dYJ4NUzsrnkKFtuBb1f_ukVThTWR4nUUf4VWq49jMADTD8-p0BduCMg5h40kbswPYomez4wVgz6XKfywm_ngjowFyOwd4CbzBXqbujMP9CjbvXHxSXfmIznXy4Twh5cpB-JMv0L6l8Ydj4FYOV8g-7fRaPK_t7Mp61hrMllWOvaxzLZ8cl6NEblru_bRuS__5787E03BVuhYisg",
                text:
                  "Coding to this mix right now. The vibe is immaculate. Anyone else working on LLMs?",
                likes: 23,
                time: "14m ago",
              },
            ]}
          />
        </div>

      </div>
    </div>
  );
}
