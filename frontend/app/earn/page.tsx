import EarnNavbar from "@/src/components/Earn/EarnNavbar/EarnNavbar";
import RecentEarningActivities from "@/src/components/Earn/RecentEarningActivities/RecentEarningActivities";
import VibePointsBreakdown from "@/src/components/Earn/VibePointsBreakdown/VibePointsBreakdown";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import styles from "./eanr.module.scss";

const Earn = () => {
  return (
    <>
      <Sidebar />
      <EarnNavbar />
      <div className={styles.Conatiner}>
        <VibePointsBreakdown />
        <RecentEarningActivities />
      </div>
    </>
  );
};

export default Earn;
