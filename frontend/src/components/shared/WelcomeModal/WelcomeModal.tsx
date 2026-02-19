"use client";

import { useEffect, useState } from "react";
import styles from "./WelcomeModal.module.scss";

export default function WelcomeModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem("vidorahub_visited");

        if (!hasVisited) {
            setOpen(true);
            localStorage.setItem("vidorahub_visited", "true");
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Close only if user clicks outside the modal
        if (e.target === e.currentTarget) {
            setOpen(false);
        }
    };

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    ✕
                </button>

                <h1 className={styles.title}>
                    Welcome to <span>VidoraHub</span> 
                </h1>

                <p className={styles.subtitle}>
                    VidoraHub is officially live — this is our first public MVP.
                    <br /><br />
                    You’re among the first users to experience a new way of sharing
                    and discovering videos.
                    <br /><br />
                    Some features are still evolving, but your presence here means
                    you're part of building this platform from the beginning.
                    <br /><br />
                    Explore. Upload. Grow with us.
                </p>
            </div>
        </div>
    );
}
