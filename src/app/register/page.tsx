"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, Alert } from "@mui/material";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start your SaaS CRM journey today</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <TextField
            label="Company Name"
            variant="outlined"
            fullWidth
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          
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
            disabled={loading}
            className={styles.submitBtn}
            sx={{ mt: 2 }}
          >
            {loading ? "Registering..." : "Sign Up"}
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link href="/login" style={{ color: '#25D366', textDecoration: 'none' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
