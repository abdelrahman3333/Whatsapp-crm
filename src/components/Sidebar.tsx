"use client";

import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ChatIcon from "@mui/icons-material/Chat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Link from "next/link";
import { usePathname } from "next/navigation";

const drawerWidth = 240;

const menuItems = [
  { text: "Overview", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Customers", icon: <PeopleIcon />, path: "/dashboard/customers" },
  { text: "Pipeline", icon: <LeaderboardIcon />, path: "/dashboard/pipeline" },
  { text: "Tasks", icon: <CheckCircleIcon />, path: "/dashboard/tasks" },
  { text: "WhatsApp", icon: <ChatIcon />, path: "/dashboard/whatsapp" },
  { text: "Automations", icon: <SmartToyIcon />, path: "/dashboard/automations" },
  { text: "Billing", icon: <CreditCardIcon />, path: "/dashboard/billing" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box", backgroundColor: "#111b21", color: "#e9edef" },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #222e35" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#00a884" }}>
          WA CRM
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => {
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  backgroundColor: active ? "#2a3942" : "transparent",
                  "&:hover": { backgroundColor: "#202c33" },
                  m: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemIcon sx={{ color: active ? "#00a884" : "#aebac1", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ color: active ? "#fff" : "#aebac1" }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
