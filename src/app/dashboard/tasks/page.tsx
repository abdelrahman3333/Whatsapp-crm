"use client";

import { useState, useEffect } from "react";
import { Typography, Box, Paper, List, ListItem, ListItemText, Checkbox, Chip, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleComplete = async (task: any) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
      // Refresh list to remove completed tasks (since our API filters them)
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>My Tasks</Typography>
      
      <Paper sx={{ p: 2 }}>
        <List>
          {tasks.length === 0 ? (
            <Typography p={2} color="textSecondary">No upcoming tasks found. Great job!</Typography>
          ) : (
            tasks.map(task => {
              const due = new Date(task.dueDate);
              const isOverdue = due < new Date();
              return (
                <ListItem 
                  key={task.id} 
                  divider 
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDelete(task.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <Checkbox 
                    edge="start" 
                    checked={task.isCompleted} 
                    onChange={() => handleToggleComplete(task)} 
                  />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="bold">{task.title}</Typography>
                        {isOverdue && <Chip label="Overdue" color="error" size="small" />}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary">
                        Customer: <Link href={`/dashboard/customers/${task.customerId}`} style={{ color: '#00a884', textDecoration: 'none' }}>{task.customer?.name}</Link> | 
                        Due: {due.toLocaleDateString()}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Paper>
    </Box>
  );
}
