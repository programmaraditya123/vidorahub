import BackgroundLayers from "@/src/components/HomePage/BackgroundLayers/BackgroundLayers";
import Header from "@/src/components/HomePage/Header/Header";
import Masonry from "@/src/components/HomePage/Masonry/Masonry";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import VibeSelector from "@/src/components/HomePage/VibeSelector/VibeSelector";
import './page.module.css'

export default function Home() {
  return (
    <>
      <BackgroundLayers />

      <div className="page-wrapper">
        <Sidebar />

        <main className="main-content">
          <Header />
          <Masonry />
        </main>

        <VibeSelector />
      </div>
    </>
  );
}
