"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TextField, Button, Alert } from "@mui/material";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your CRM account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <TextField
            label="Email Address"
            type="email"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            className={styles.submitBtn}
            sx={{ mt: 2 }}
          >
            Sign In
          </Button>
        </form>

        <div className={styles.footer}>
          Don't have an account? <Link href="/register" style={{ color: '#25D366', textDecoration: 'none' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
