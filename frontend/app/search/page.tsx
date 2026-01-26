import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./SearchGrid.module.scss";
import VideoCard from "./VideoCard";
import Link from "next/link";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";

export default function SearchPage() {
  return (
    <div className={styles.page}>
        <div className={styles.hideSidebar}>
        <Sidebar/>
        </div>

      {/* Navbar */}
      <header className={styles.navbar}>
      <div className={styles.navInner}>
        
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon1}><VidorahubIcon.VidorahubIcon width={36} height={36}
          color="purple"/></div>
          <Link href={'/'} className={styles.LinkLine}>
          <h1>
            Vidora<span>Hub</span>
          </h1>
          </Link>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}><VidorahubIcon.SearchIcon /></span>
          <input
            placeholder="Search premium cinematography..."
            type="text"
          />
          {/* <button className={styles.filterBtn}>⚙</button> */}
        </div>

        {/* Right */}
        <div className={styles.userActions}>
          <button className={styles.bell}>🔔</button>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeDIXr-WP5-bhGxF9ZaRGnTCcauSZeTrkGqRh38U8PSnBjPD7fjxNZNG451eq5dPwLR0Isr83UTiEz0H2CAy6pk4oTC_e5H5iUyCdPIFI-3sj0G-x_KZMXYOml97Qg5lItk5ki8XB35FF5m7FXb7ECi_McM1YF-anzqSRkrbqLNHIcChBTeMxORspuDLqne6Oyc067AmrOBcELBoP5ZlGp0N5xehce4k5UCphHfM7SCCwUUT5BAvGWjAlap2VNpGWzLTHkUFJWkT-Q"
            alt="avatar"
          />
        </div>
      </div>
    </header>

      <main className={styles.main}>
        {/* Filter Bar */}
        <div className={styles.filterBar}>
  <div className={styles.tabs}>
    <button className={styles.active}>Relevance</button>
    <button>Newest</button>
    <button>Trending</button>
    <button>Most Liked</button>
  </div>

  <div className={styles.resultsInfo}>
    Showing 1,240 results for <i>"Cinematic Landscapes"</i>
  </div>
</div>



        {/* Grid */}
        <div className={styles.grid}>
          <VideoCard
            title="The Solitude of the Nordic Peaks"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDvwZChDTnp1Ex_oeWGos7BJC9wbvsSj0KT0rMKC09eta0_jEidTBMPoiXzLP_sInAipF18G8hkgLMlSPOqqL7NDLHIw0i4L1XFYrToVrAl4EbNtM3MFPT11gB-cSKRAY3q6yI3qO6m1k2ExJ9X-ykTnxLTy5Xu0AXMStP8gGyPeSIMMkjwsP74YJCTi5mc1WS4JWaP6z9bW1Cpvak-3MgwLe7eqLli0B4cPv3VgJ4tWmBRjwfp6jQgJxk6OGwIt-BqQYoT0XZG6H49"
            creator="Aether Visuals"
            time="12:45"
          />

          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
          <VideoCard
            title="Cyberpunk Reality: Tokyo 2077"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNiZzDZlwUpbE0EYjrQXS25SggPGSXONRO5bTdQD30y1Fg4aWZsgQM0w5ZyDbgFMDVu-5cL77LXwF7agJbyqyWDagAs_5zWQdozlY34GgCOarmYfC2c-vxB3FRzqucYdmgnEMahcnn_XbxCbS4ehw5TsJiXLld-Wyqms-GOgtpBHeQV849E8g9ZmN_gqE1lHYjc6-cqh618VKZQSxVODqgxZm4dZDHEQsuVbKsx5YUfFPlmjgCU8mnyJvKm3VlAXFJ0n09P5aRxyDd"
            creator="Neon Pulse Studio"
            time="08:22"
          />
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button className={styles.active}>Load More</button>
           
        </div>
      </main>

      <div className={styles.glow1}></div>
      <div className={styles.glow2}></div>
    </div>
  );
}
