"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Authmodal.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import Portal from "./Portal";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  message = "Sign in to interact with this content.",
}: AuthModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Save current path so LoginPage can redirect back after successful login
  const handleSignIn = () => {
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    router.push("/login");
    onClose();
  };

  const handleRegister = () => {
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    router.push("/signup");
    onClose();
  };

  return (
    <Portal>
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-heading"
        onClick={onClose}
      >
        <div className={styles.card} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          <div className={styles.brand}>
            <VidorahubIcon.VidorahubIcon
              color="purple"
              height={26}
              width={26}
            />
            <span>VidoraHub</span>
          </div>

          <h2 id="auth-modal-heading" className={styles.heading}>
            Sign in to continue
          </h2>

          <p className={styles.message}>{message}</p>

          <button onClick={handleSignIn} className={styles.primaryBtn}>
            Sign in
          </button>

          <p className={styles.registerLine}>
            Don&apos;t have an account?{" "}
            <button onClick={handleRegister} className={styles.registerBtn}>
              Register
            </button>
          </p>

          <div className={styles.glow} aria-hidden="true" />
        </div>
      </div>
    </Portal>
  );
}
