"use client";

import { useState } from "react";
import styles from "./LoginPage.module.scss";
import { useRouter } from "next/navigation";
import { userLogin } from "@/src/lib/auth/auth";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import Loader from "@/src/components/ui/loader/Loader";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await userLogin({
        email: form.email,
        password: form.password,
      });

      if (!res.ok) {
        toastError(res.message || "Wrong Email or Password");
        return;
      }

      localStorage.setItem("token", res.token);
      success("🎉 Logged in successfully!");
      router.replace("/");
    } catch (err: any) {
      toastError(err.message || "Login failed");
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
          <h2>VidoraHub</h2>
        </div>
        <div className={styles.links}>
          <a href="#">About</a>
          <a href="#">Terms</a>
        </div>
      </header>

      <div className={styles.main}>
        {/* LEFT VISUAL */}
        <div className={styles.left}>
          <div className={styles.glowBg}></div>

          <div className={styles.logoContainer}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA659qtM55c309D0e8fkWH4Mb_fYBP6YZt7S2Eg4DFaVnWN9K1T-_Gz2Wma-Hq6dCGZ34OlP9xFLAgcS6pOACM1qsSafGnICRBLdl2Dv2Z7iBggPh0Lgk8gkuX-BqCtcdjuO-yVB65XpCWQJJxKaiAh8i5WvrYi8sAdRekzh8LoUiAKy8MkUQbYKHFwFT9sBsYZt5TyXuN-ys0LkotYJwPwCipOhVeV6mERLWk0lpC5aA4SG30jTNFLT0hH6PzwnZ-90z5zOdceu4fs"
              alt="VidoraHub Logo"
            />
            <div className={styles.pulse}></div>
          </div>

          <p className={styles.phase}>PHASE 01: CORE ACCESS</p>
        </div>

        {/* RIGHT FORM */}
        <div className={styles.right}>
          <div className={styles.glassCard}>
            <div className={styles.header}>
              <p className={styles.portal}>PORTAL INTERFACE</p>
              <h1>Access Portal</h1>
              <span>Secure your session in the hub.</span>
            </div>

            <form className={styles.form} onSubmit={onSignin}>
              <div className={styles.field}>
                <label>Identity</label>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Credentials</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <button className={styles.loginBtn} disabled={loading}>
                {loading ? <Loader /> : "Enter Hub"}
              </button>
            </form>

            <div className={styles.footer}>
              <p>
                New to the stream?
                <Link href="/signup"> Join the Hub</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOBS */}
      <div className={styles.blobTop}></div>
      <div className={styles.blobBottom}></div>
    </div>
  );
}
