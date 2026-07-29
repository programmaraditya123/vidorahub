'use client'

import Header from "@/src/components/HomePage/Header/Header";
import FilterVideos from "@/src/components/HomePage/FilterVideos/FilterVideos";
import Masonry from "@/src/components/HomePage/Masonry/Masonry";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import './page.module.css';
import { useUserActivity } from "@/src/hooks/ui/Shared/useUserActivity";


export default function Home() {
  useUserActivity()
  return (
    <>
      <div className="page-wrapper">
        <div className="sidebar-container">
          <Sidebar />
        </div>
        <main className="main-content">
          <Header />
          <FilterVideos  />
          <Masonry />
        </main>
      </div>
    </>
  );
}
