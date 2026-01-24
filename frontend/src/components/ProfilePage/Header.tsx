import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "../../../app/profile/Profile.module.scss";
import Link from "next/link";


export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.logoBox} ${styles.glass}`}>
        <Link href={'/'} className={styles.logoLink}>
        <span className={styles.logo}><VidorahubIcon.VidorahubIcon height={22} width={22} color="purple"/> 
        VidoraHub</span></Link>

        <nav className={styles.nav}>
          <a>Universe</a>
          <a>Trending</a>
          <a>Live</a>
        </nav>
      </div>

      <div className={styles.headerRight}>
        <div className={`${styles.searchBox} ${styles.glass}`}>
          <input placeholder="Explore universes..." />
        </div>

        <div className={`${styles.iconBtn} ${styles.glass}`}>🔔</div>

        <div
          className={styles.avatarSmall}
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCatHzKNH0w4j21uqC8H-Iy9eIaPN7ZxjH5snkAiUoZwC0961xEtPQ-zRC8ND_-lRPqFlRIoNl6cRvegPhc8CB4rXeARlO4OeQFhPySr0uzv9XTI9gD71O2OpD5HjFTRMYJ0g0A_8E7tUShT4bn0DoKlrVhh-vz8issQrhuI9KxErZWdebE44pZpHjAhT9ueJQ6Qpkh-vfuwRrDi9qmzTx9oTF-CHlIc9p_CmOS4qA6TK-hQKFLc6HmKrqe1GABj2bWP-m6TojgGyUL')",
          }}
        />
      </div>
    </header>
  );
}
