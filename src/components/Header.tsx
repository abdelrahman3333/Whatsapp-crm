"use client";

import { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Badge, Menu, MenuItem } from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/tasks")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Filter tasks due today or overdue
            const now = new Date();
            const urgent = data.filter(t => t.dueDate && new Date(t.dueDate) <= now);
            setTasks(urgent);
          }
        });
    }
  }, [session]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="fixed" sx={{ width: `calc(100% - 240px)`, ml: `240px`, backgroundColor: '#ffffff', color: '#111b21', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        
        <IconButton color="inherit" onClick={handleOpen} sx={{ color: '#54656f' }}>
          <Badge badgeContent={tasks.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          slotProps={{ paper: { sx: { width: 300, maxHeight: 400 } } }}
        >
          <MenuItem disabled sx={{ fontWeight: 'bold', color: 'black' }}>
            Urgent Tasks ({tasks.length})
          </MenuItem>
          {tasks.length === 0 ? (
            <MenuItem onClick={handleClose}>No urgent tasks</MenuItem>
          ) : (
            tasks.map(task => (
              <MenuItem key={task.id} onClick={handleClose} component={Link} href={`/dashboard/customers/${task.customerId}`}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>{task.title}</Typography>
                  <Typography variant="caption" color="error">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
          <MenuItem onClick={handleClose} component={Link} href="/dashboard/tasks" sx={{ justifyContent: 'center', color: '#00a884', fontWeight: 'bold' }}>
            View All Tasks
          </MenuItem>
        </Menu>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {session?.user?.name || "User"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {(session?.user as any)?.role || "AGENT"}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: '#00a884' }}>
            {session?.user?.name?.charAt(0) || "U"}
          </Avatar>
          <IconButton onClick={() => signOut({ callbackUrl: '/login' })} color="error" title="Logout">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
