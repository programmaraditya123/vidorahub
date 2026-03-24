"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./EanrNavbar.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
// import { Bell, Settings, Menu, X } from "lucide-react";

export default function EarnNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [token,setToken] = useState<string | null>(null);

  

  const navItems = [
    { name: "Dashboard", href: `https://studio.vidorahub.com/login/${token}` },
    { name: "Earnings", href: "/earn" },
    { name: "Content", href: "/profile" },
  ];

  useEffect(() => {
    const Storedtoken = localStorage.getItem("token");
    setToken(Storedtoken)

  },[])

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* LEFT */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <VidorahubIcon.VidorahubIcon height={28} width={28} />
          </div>
          <span className={styles.logoText}>VidoraHub</span>
        </div>

        {/* CENTER (Desktop/Tablet) */}
        <div className={`${styles.navLinks} ${open ? styles.open : ""}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                {...(item.name === "Dashboard"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className={styles.actions}>
          <button className={styles.iconBtn}>
            <VidorahubIcon.BellAlertIcon />
          </button>

          <button className={styles.iconBtn}>
            <VidorahubIcon.SettingsIcon />
          </button>

          <div className={styles.avatar}>A</div>

          {/* Hamburger */}
          <button className={styles.menuBtn} onClick={() => setOpen(!open)}>
            {open ? (
              <VidorahubIcon.CrossIcon size={20} color="#fff" />
            ) : (
              <VidorahubIcon.HamburgerIcon size={20} color="#fff" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
