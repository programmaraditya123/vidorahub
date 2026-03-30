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
      {/* TOP BAR */}
      <div className={styles.bar}>
        <div className={styles.left}>
          <p className={styles.label}>Total Points Earned</p>
          <h2 className={styles.points}>{totalPoints} pts</h2>
        </div>

        <button className={styles.withdrawBtn} onClick={() => setOpen(true)}>
          Withdraw
        </button>
      </div>

      {/* MODAL */}
      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* <div className={styles.modalIcon}>🇮🇳</div> */}

            <h3 className={styles.modalTitle}>Withdrawals aren't open yet</h3>

            <p className={styles.modalBody}>
              VidoraHub is still growing. Your points are{" "}
              <strong>safe and recorded</strong> — they'll convert to real money
              once our platform is fully funded.
            </p>

            <div className={styles.modalPledge}>
              {/* <span>🔒</span> */}
              <p>
                Every point you earn today <strong>will be paid out</strong>. We promise.
              </p>
            </div>

            <p className={styles.modalFooter}>
              Keep creating — early creators like you will be rewarded first.
            </p>

            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              Got it, I'll keep going
            </button>

          </div>
        </div>
      )}
    </>
  );
}