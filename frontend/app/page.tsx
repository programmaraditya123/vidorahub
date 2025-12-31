'use client'


import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./page.module.css";
import HomePageSideBar from "@/src/components/shared/homepagesidebar/HomePageSideBar";
import HomeNavbar from "@/src/components/shared/homenavbar/HomeNavbar";
import VideoCard from "@/src/components/ui/videocard/VideoCard";
import CategoryTabs from "@/src/components/ui/CategoryTabs/CategoryTabs";
import { useAppSelector } from "@/src/redux/hooks";



export default function Home() {
  const isCollapsed = useAppSelector((state) => state.ui.isCollapsed)
  return (
  <div className={styles.home}>
      <div className={isCollapsed ? styles.homeleft1 : styles.homeleft }>
        <HomePageSideBar/>
      </div>
      <div className={isCollapsed ?  styles.homeright2 : styles.homeright }>
        <div className={styles.navdiv}>
        <HomeNavbar/>

        </div>
        <div className={styles.categorytabs}>
          <CategoryTabs/>
        </div>
        <div className={styles.videocardcontainer}>
           <VideoCard/>
        </div>
      
      </div>  
  </div>
  );
}
