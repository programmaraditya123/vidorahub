"use client";

import { useEffect, useRef, useState } from "react";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "../../../app/profile/Profile.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSerialNumber");
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
          <Link
            href={`https://studio.vidorahub.com/login/${token}`}
            target="_blank"
          >
            <p>Dashboard</p>
          </Link>
          <a onClick={handleEarn}>Earning</a>
          <a onClick={handleUpload}>Upload</a>
          <a onClick={handleLogout}>Logout</a>
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
        </div>
      )}
    </header>
  );
}