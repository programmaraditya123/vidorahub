"use client";

import { useState } from "react";
import styles from "./EarnBar.module.scss";

type EarningsBarProps = {
  totalPoints: number;
};

export default function EarnBar({ totalPoints }: EarningsBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔥 TOP BAR */}
      <div className={styles.bar}>
        <div className={styles.left}>
          <p className={styles.label}>Total Points Earned</p>
          <h2 className={styles.points}>{totalPoints} pts</h2>
        </div>

        <button className={styles.withdrawBtn} onClick={() => setOpen(true)}>
          Withdraw
        </button>
      </div>

      {/* 🚧 MODAL */}
      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Withdraw Coming Soon 🚀</h3>

            <p>
              We're currently building a sustainable earning system for creators.
              Withdrawals will be enabled once VidoraHub secures funding and
              establishes revenue streams.
            </p>

            <p>
              Your points are सुरक्षित (safe) and will be fully redeemable in the
              future. Keep creating and growing 🚀
            </p>

            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}