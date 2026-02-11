"use client";

import { useEffect, useRef, useState } from "react";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./SearchGrid.module.scss";
import VideoCard from "./VideoCard";
import Link from "next/link";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import { getNextVideos } from "@/src/lib/video/videodata";

export default function SearchPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchVideos = async (pageNumber: number, searchValue: string) => {
  if (loading) return;

  setLoading(true);

  try {
    const res = await getNextVideos({
      videoId: "698433e6e40ae5469b853114",
      page: pageNumber,
      limit: 10,
      search: searchValue,
    });

    setVideos((prev) =>
      pageNumber === 1 ? res.data : [...prev, ...res.data]
    );

    setHasNext(res.pagination.hasNextPage);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    setPage(1)
    fetchVideos(1,debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
  if (!loaderRef.current) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNext && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, debouncedSearch);
    }
  });

  observer.observe(loaderRef.current);
  return () => observer.disconnect();
}, [page, hasNext, loading, debouncedSearch]);


  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 400);

  return () => clearTimeout(timer);
}, [search]);


  return (
    <div className={styles.page}>
      <div className={styles.hideSidebar}>
        <Sidebar />
      </div>

      {/* Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon1}>
              <VidorahubIcon.VidorahubIcon width={36} height={36} color="purple" />
            </div>
            <Link href={"/"} className={styles.LinkLine}>
              <h1>
                Vidora<span>Hub</span>
              </h1>
            </Link>
          </div>

          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <VidorahubIcon.SearchIcon />
            </span>
            <input placeholder="Search premium cinematography..." type="text"
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.userActions}>
            <button className={styles.bell}>🔔</button>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCe..." />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              title={video.title}
              image={video.thumbnailUrl}
              creator={video.uploader?.name}
              time={Math.floor(video.duration / 60) + ":" + Math.floor(video.duration % 60)}
              videoUrl={video.videoUrl}
              id={video._id}            />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 40 }} />

        {loading && <p>Loading...</p>}
        {/* {!hasNext && <p>No more videos</p>} */}
      </main>
    </div>
  );
}
