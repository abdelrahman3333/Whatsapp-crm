"use client";

import { useState, useEffect } from "react";
import { Typography, Box, Paper, Grid, LinearProgress, Button, Card, CardContent, CardActions } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function BillingPage() {
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then(res => res.json())
      .then(data => setBillingInfo(data));
  }, []);

  if (!billingInfo) return <Typography>Loading billing details...</Typography>;
  if (billingInfo.error) return <Typography color="error">Error loading billing: {billingInfo.error}. Please try again in a moment while the database updates.</Typography>;

  const { plan, usage, limits } = billingInfo;

  const getProgress = (current: number, max: number) => {
    if (max === null || max === undefined || max === 0) return 0;
    if (max === Infinity) return 0;
    const perc = (current / max) * 100;
    return perc > 100 ? 100 : perc;
  };

  const isUnlimited = (val: number) => val === Infinity || val === null;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>Billing & Subscriptions</Typography>
      <Typography color="textSecondary" sx={{ mb: 4 }}>Manage your current plan and usage limits.</Typography>

      <Grid container spacing={4}>
        {/* Current Usage */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>Current Plan: {plan}</Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Outbound Messages (This Month)</Typography>
                <Typography variant="body2">{usage.messages} / {isUnlimited(limits.messages) ? 'Unlimited' : limits.messages}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgress(usage.messages, limits.messages)} 
                sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#00a884' } }} 
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Customers</Typography>
                <Typography variant="body2">{usage.customers} / {isUnlimited(limits.customers) ? 'Unlimited' : limits.customers}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgress(usage.customers, limits.customers)} 
                sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#00a884' } }} 
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Users (Agents)</Typography>
                <Typography variant="body2">{usage.users} / {isUnlimited(limits.users) ? 'Unlimited' : limits.users}</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgress(usage.users, limits.users)} 
                sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#00a884' } }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Upgrade Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: plan === 'PREMIUM' ? '2px solid #00a884' : 'none' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1, color: '#00a884' }}>Premium Plan</Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>$99<Typography component="span" variant="body1" color="textSecondary">/mo</Typography></Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Unlimited Users</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Unlimited Customers</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Unlimited WhatsApp Messages</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Priority Support</Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ p: 2 }}>
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ bgcolor: '#00a884', '&:hover': { bgcolor: '#008f6f' } }}
                disabled={plan === 'PREMIUM'}
              >
                {plan === 'PREMIUM' ? 'Current Plan' : 'Upgrade to Premium'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
