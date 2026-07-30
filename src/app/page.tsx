"use client";

import Link from "next/link";
import { Button, Container, Typography, Box } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }} color="primary">
        SaaS WhatsApp CRM
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
        Manage your customers, pipelines, and WhatsApp conversations all in one place.
      </Typography>
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button component={Link} href="/login" variant="contained" color="primary" size="large">
          Login
        </Button>
        <Button component={Link} href="/register" variant="outlined" color="primary" size="large">
          Register Company
        </Button>
      </Box>
    </Container>
  );
}
