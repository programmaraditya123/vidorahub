import Sidebar from "@/src/components/History/Sidebar";
import styles from "./history.module.scss"
import Timeline from "@/src/components/History/Timeline";
import VideoCard from "@/src/components/History/VideoCard";
import Analytics from "@/src/components/History/Analytics";

export default function ArchivePage() {
  return (
    <div className={styles.app}>
      <Sidebar />

      <main className={styles.main}>
        <Timeline />

        <div className={styles.feed}>
          <header className={styles.header}>
            <div>
              <h2>Chronological Archive</h2>
              <p>Surgical precision history tracking</p>
            </div>
            <div className={styles.actions}>
              <button>Filter</button>
              <button className={styles.danger}>Clear History</button>
            </div>
          </header>

          <section>
            <h3>This Morning</h3>

            <VideoCard
              title="Advanced Quantum Computing Explained"
              channel="TechNova Studios"
              views="2.4M views"
              duration="24:15"
              category="Education"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuB9DTq9PnvVFlH9YHo8WMoAwjuz-m_Hf-aoYQ_Imspi2GJgW0K-xgv0fmCxTDNtRe0OROtR2T70rEbzvw-s9YMT0E9a3YQSOw72dPeYOr3meu7V9Kd8BH6vxqO5tcc2brl2nsNlT5WSpiMLkmx0uRB5HKOPlm1JM8QP0vFsPz6ckE91PkxylpBj-lcnzZCpRRAXzo5E-Qv6FWjlZfQhaZpr10xroobtnYbXmFefM4gyTrAEG-e6gi6ihZKMgusSYs26BrCQA0xOeTIm"
            />
          </section>
        </div>

        <Analytics />
      </main>
    </div>
  );
}
