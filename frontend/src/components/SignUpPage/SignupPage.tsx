"use client";

import { useState, useCallback } from "react";
import styles from "./SignupPage.module.scss";
import { useRouter } from "next/navigation";
import { userRegister } from "@/src/lib/auth/auth";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import Loader from "@/src/components/ui/loader/Loader";
import Link from "next/link";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

export default function SignupPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;

      if (!name || !email || !password) {
        toastError("Please fill all fields");
        return;
      }

      setLoading(true);
      try {
        const res = await userRegister({ name, email, password });

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
    },
    [name, email, password, loading, router, success, toastError]
  );

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <VidorahubIcon.VidorahubIcon color="purple" height={32} width={32} />
          <Link href="/" className={styles.linktext}>
            <h2>VidoraHub</h2>
          </Link>
        </div>
        <p className={styles.loginText}>
          <Link href="/login">Log In</Link>
        </p>
      </header>

      <main className={styles.main}>
        <div className={styles.cardContainer}>
          <div className={styles.step}>
            <div className={styles.header}>
              <p className={styles.portal}>GET STARTED</p>
              <h1>Create Account</h1>
            </div>

            <form className={styles.form} onSubmit={onSignup} noValidate>
              <div className={styles.field}>
                <label htmlFor="signup-name">Your Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Display name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.signupBtn}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <Loader /> : "Create Account"}
              </button>
            </form>

            <div className={styles.footer}>
              <p>
                Already have an account?{" "}
                <Link href="/login">Log in to VidoraHub</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className={styles.blobTop} aria-hidden="true" />
      <div className={styles.blobBottom} aria-hidden="true" />
    </div>
  );
}