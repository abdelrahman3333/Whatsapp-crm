"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, CircularProgress, Card, CardContent } from "@mui/material";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>Sales Dashboard</Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleAltIcon sx={{ color: '#1976d2', fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Customers Today</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                  {stats?.customersToday || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AttachMoneyIcon sx={{ color: '#2e7d32', fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Total Revenue</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                  ${stats?.totalRevenue?.toLocaleString() || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ffe0b2' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon sx={{ color: '#ed6c02', fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Conversion Rate</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                  {stats?.conversionRate || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#f3e5f5', border: '1px solid #e1bee7' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AutorenewIcon sx={{ color: '#9c27b0', fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Open Deals</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4a148c' }}>
                  {stats?.deals?.open || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Agents Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Top Performing Agents (Revenue)</Typography>
            {stats?.topAgents?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topAgents} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="textSecondary">No deals won yet.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Lead Sources Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Lead Sources</Typography>
            {stats?.leadSources?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.leadSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.leadSources.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="textSecondary">No customers added yet.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
