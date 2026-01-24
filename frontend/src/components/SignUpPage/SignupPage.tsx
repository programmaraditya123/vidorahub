"use client";

import { useState } from "react";
import styles from "./SignupPage.module.scss";
import { useRouter } from "next/navigation";
import { userRegister } from "@/src/lib/auth/auth";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import Loader from "@/src/components/ui/loader/Loader";
import Link from "next/link";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

/* SCALABLE VIBES */
const VIBES = [
  { id: "gaming", label: "Gaming", icon: "sports_esports" },
  { id: "music", label: "Music", icon: "music_note" },
  { id: "tech", label: "Tech", icon: "memory" },
  { id: "art", label: "Art & Design", icon: "palette" },
  { id: "cinema", label: "Cinema", icon: "movie" },
  { id: "science", label: "Science", icon: "rocket_launch" },
  { id: "lifestyle", label: "Lifestyle", icon: "fitness_center" },
  { id: "travel", label: "Travel", icon: "public" },
];

export default function SignupPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    vibes: [] as string[],
  });

  const toggleVibe = (id: string) => {
    setForm((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(id)
        ? prev.vibes.filter((v) => v !== id)
        : [...prev.vibes, id],
    }));
  };

  const onSignup = async () => {
    setLoading(true);
    try {
      const res = await userRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        // vibes: form.vibes,
      });

      if (!res.success) {
        toastError(res.message || "Registration failed");
        return;
      }

      success("Account created successfully!");
      router.replace("/login");
    } catch (err: any) {
      toastError(err.message || "Signup failed");
    } finally {
      setLoading(false);
      
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* NAV */}
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <VidorahubIcon.VidorahubIcon color="purple" height={32} width={32} />
          <Link href={'/'} className={styles.linktext}>
          <h2>VidoraHub</h2>
          </Link>
        </div>
        <p className={styles.loginText}>
          Already have an identity?
          <Link href="/login"> Log In</Link>
        </p>
      </header>

      <main className={styles.main}>
        <div className={styles.cardContainer}>
          {/* STEP 1 */}
          <div
            className={`${styles.step} ${
              step === 1 ? styles.active : styles.hiddenLeft
            }`}
          >
            <div className={styles.header}>
              <h1>Initialize Identity</h1>
              <p>Define your digital presence.</p>
            </div>

            <form className={styles.form}>
              <div className={styles.field}>
                <label>Avatar Alias</label>
                <input
                  type="text"
                  placeholder="Display name"
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Communication Channel</label>
                <input
                  type="email"
                  placeholder="Email address"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Access Credentials</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setStep(2)}
              >
                Continue to Vibe →
              </button>
            </form>
          </div>

          {/* STEP 2 */}
          <div
            className={`${styles.step} ${
              step === 2 ? styles.active : styles.hiddenRight
            }`}
          >
            <div className={styles.header}>
              <h1>What defines your journey?</h1>
              <p>Select the energy clusters that match your pulse.</p>
            </div>

            <div className={styles.vibeCloud}>
              {VIBES.map((vibe) => (
                <button
                  key={vibe.id}
                  type="button"
                  className={`${styles.vibeBubble} ${
                    form.vibes.includes(vibe.id) ? styles.selected : ""
                  }`}
                  onClick={() => toggleVibe(vibe.id)}
                >
                  <span className="material-symbols-outlined">
                    {vibe.icon}
                  </span>
                  {vibe.label}
                </button>
              ))}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.signupBtn}
                disabled={loading || form.vibes.length === 0}
                onClick={onSignup}
              >
                {loading ? <Loader /> : "Create Identity"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
