'use client'

import Header from "@/src/components/HomePage/Header/Header";
import FilterVideos from "@/src/components/HomePage/FilterVideos/FilterVideos";
import Masonry from "@/src/components/HomePage/Masonry/Masonry";
import HomeVibesFeed from "@/src/components/HomePage/HomeVibesFeed/HomeVibesFeed";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import HomeStarter from "@/src/components/HomePage/HomeStarter/HomeStarter";
import './page.module.css';
import { useUserActivity } from "@/src/hooks/ui/Shared/useUserActivity";
import { useState } from "react";


export default function Home() {
  useUserActivity()
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <>
      <div className="page-wrapper">
        <div className="sidebar-container">
          <Sidebar />
        </div>
        <main className="main-content">
          <Header />
          <FilterVideos
            selectedTopic={selectedCategory}
            onTopicChange={setSelectedCategory}
          />
          <Masonry
            key={selectedCategory}
            selectedCategory={selectedCategory}
            afterFirstRow={<HomeVibesFeed selectedCategory={selectedCategory} />}
          />
        </main>
      </div>
      <HomeStarter />
    </>
  );
}
