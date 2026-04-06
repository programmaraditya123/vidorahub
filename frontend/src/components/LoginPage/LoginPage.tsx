"use client";

import { useState, useCallback } from "react";
import styles from "./LoginPage.module.scss";
import { useRouter } from "next/navigation";
import { userLogin } from "@/src/lib/auth/auth";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import Loader from "@/src/components/ui/loader/Loader";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";

const AUTH_ROUTES = ["/login", "/signup"];

export default function LoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);

      try {
        const res = await userLogin({ email, password });

        if (!res.success) {
          toastError(res.message || "Wrong Email or Password");
          return;
        }

        localStorage.setItem("token", res.token);
        localStorage.setItem("userName", res.user?.name ?? "");
        localStorage.setItem(
          "userSerialNumber",
          res.user?.userSerialNumber ?? "",
        );

        success("Logged in successfully!");

        const savedPath = sessionStorage.getItem("redirectAfterLogin");
        sessionStorage.removeItem("redirectAfterLogin");

        const destination =
          savedPath && !AUTH_ROUTES.includes(savedPath) ? savedPath : "/";

        router.replace(destination);
      } catch (err: any) {
        toastError(err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading, router, success, toastError],
  );

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credentialResponse.credential }),
        },
      );

      const data = await res.json();

      if (!data.success) {
        toastError(data.message || "Google login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user?.name ?? "");
      localStorage.setItem(
        "userSerialNumber",
        data.user?.userSerialNumber ?? "",
      );

      success("Logged in with Google!");

      const savedPath = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");

      const destination =
        savedPath && !AUTH_ROUTES.includes(savedPath) ? savedPath : "/";

      router.replace(destination);
    } catch (err: any) {
      toastError("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <VidorahubIcon.VidorahubIcon color="purple" height={32} width={32} />
          <Link href="/" className={styles.linktext}>
            <h2>VidoraHub</h2>
          </Link>
        </div>
        <nav className={styles.links}>
          <a
            href="https://about.vidorahub.com/aboutus"
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
          <a
            href="https://about.vidorahub.com/privacypolicy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>
        </nav>
      </header>

      <div className={styles.main}>
        <div className={styles.left} aria-hidden="true">
          <div className={styles.glowBg} />
          <div className={styles.logoContainer}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA659qtM55c309D0e8fkWH4Mb_fYBP6YZt7S2Eg4DFaVnWN9K1T-_Gz2Wma-Hq6dCGZ34OlP9xFLAgcS6pOACM1qsSafGnICRBLdl2Dv2Z7iBggPh0Lgk8gkuX-BqCtcdjuO-yVB65XpCWQJJxKaiAh8i5WvrYi8sAdRekzh8LoUiAKy8MkUQbYKHFwFT9sBsYZt5TyXuN-ys0LkotYJwPwCipOhVeV6mERLWk0lpC5aA4SG30jTNFLT0hH6PzwnZ-90z5zOdceu4fs"
              alt=""
              width={200}
              height={200}
              loading="lazy"
              decoding="async"
              // @ts-ignore
              fetchpriority="low"
            />
            <div className={styles.pulse} />
          </div>
          <p className={styles.phase}>PHASE 01: CORE ACCESS</p>
        </div>

        <div className={styles.right}>
          <div className={styles.glassCard}>
            <div className={styles.header}>
              <p className={styles.portal}>PORTAL INTERFACE</p>
              <h1>Login</h1>
            </div>

            <form className={styles.form} onSubmit={onSignin} noValidate>
              <div className={styles.field}>
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "4px" }}>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => toastError("Google Login Failed")}
                />
              </div>

              <button
                className={styles.loginBtn}
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <Loader /> : "Enter Hub"}
              </button>
            </form>

            <div className={styles.footer}>
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/signup">Sign up for VidoraHub</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.blobTop} aria-hidden="true" />
      <div className={styles.blobBottom} aria-hidden="true" />
    </div>
  );
}