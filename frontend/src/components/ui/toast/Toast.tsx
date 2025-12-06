"use client";

import { useEffect } from "react";
import styles from "./Toast.module.scss";

export type ToastType = "success" | "error" | "info";

type Props = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  onClose: (id: number) => void;
  icon?: React.ReactNode;
};

export default function Toast({ id, message, type, duration, onClose, icon }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(t);
  }, [duration, id, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
  {icon && <span className={styles.icon}>{icon}</span>}
  <span className={styles.msg}>{message}</span>
</div>

  );
}
