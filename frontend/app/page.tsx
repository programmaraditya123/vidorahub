import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./page.module.css";
import HomePageSideBar from "@/src/components/shared/homepagesidebar/HomePageSideBar";
import HomeNavbar from "@/src/components/shared/homenavbar/HomeNavbar";
import VideoCard from "@/src/components/ui/videocard/VideoCard";



export default function Home() {
  return (
  <div className={styles.home}>
      <div className={styles.homeleft}>
        <HomePageSideBar/>
      </div>
      <div className={styles.homeright}>
        <HomeNavbar/>
        {/* <VidorahubIcon.VidorahubIcon className={styles.largeIcon} /> */}
        <div className={styles.videocardcontainer}>
           <VideoCard/>
        </div>
      
      </div>  
  </div>
  );
}
