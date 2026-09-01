"use client";

import { useEffect, useRef, useState } from "react";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "../../../app/profile/Profile.module.scss";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const AUTH_CHANGED_EVENT = "vidorahub:auth-changed";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const isSettings = pathname === "/profile/setting";
  const isProfile = pathname === "/profile"

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSerialNumber");
    localStorage.removeItem("ppurl")
    localStorage.removeItem("activeProfileId")
    localStorage.clear()
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.replace("/");
  };

  const handleUpload = () => {
    router.replace("/upload");
  };

  const handleEarn = () => {
    router.replace("/earn");
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={`${styles.logoBox} ${styles.glass}`}>
        <Link href="/" className={styles.logoLink}>
          <span className={styles.logo}>
            <VidorahubIcon.VidorahubIcon
              height={22}
              width={22}
              color="purple"
            />
            VidoraHub
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav}>
          <Link href={'/profile'} className={isProfile ? styles.activeNavLink : ""}>Profile</Link>
          <Link
            href={`https://studio.vidorahub.com/login/${token}`}
            target="_blank"
          >
            <p>Dashboard</p>
          </Link>
          <a onClick={handleEarn}>Earning</a>
          <a onClick={handleUpload}>Upload</a>
          <a onClick={handleLogout}>Logout</a>
          <Link
            href="/profile/setting"
            className={isSettings ? styles.activeNavLink : ""}
          >
            Setting
          </Link>
        </nav>
      </div>

      <div className={styles.headerRight}>
        <button
          ref={menuBtnRef}
          className={styles.menuBtn}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div ref={menuRef} className={`${styles.mobileMenu} ${styles.glass}`}>
          <Link
            href="/profile"
            className={`${styles.logoutMobile} ${isSettings ? styles.activeMobileLink : ""}`}
          >
           Profile
          </Link>
          <Link
            href={`https://studio.vidorahub.com/login/${token}`}
            target="_blank"
            className={styles.logoutMobile}
          >
            <p>Dashboard</p>
          </Link>
          <a onClick={handleEarn} className={styles.logoutMobile}>
            Earning
          </a>
          <a onClick={handleUpload} className={styles.logoutMobile}>
            Upload
          </a>
          <a onClick={handleLogout} className={styles.logoutMobile}>
            Logout
          </a>
          <Link
            href="/profile/setting"
            className={`${styles.logoutMobile} ${isSettings ? styles.activeMobileLink : ""}`}
          >
            Setting
          </Link>
        </div>
      )}
    </header>
  );
}
