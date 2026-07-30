"use client";

import { useState, useEffect, use } from "react";
import { 
  Typography, Box, Paper, Grid, Divider, Button, 
  TextField, List, ListItem, ListItemText, MenuItem, Select,
  LinearProgress, IconButton, Tooltip, Chip
} from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [customer, setCustomer] = useState<any>(null);
  const [aiProfile, setAiProfile] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(res => res.json())
      .then(data => setCustomer(data));
      
    fetch(`/api/customers/${id}/ai-analysis`)
      .then(res => res.json())
      .then(data => setAiProfile(data));
      
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [id]);

  const handleCreateTask = async () => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          dueDate: taskDueDate,
          customerId: id,
          assignedUserId: assignedUserId
        })
      });
      if (res.ok) {
        setTaskTitle("");
        setTaskDueDate("");
        setAssignedUserId("");
        // Reload customer to get new task
        fetch(`/api/customers/${id}`).then(r => r.json()).then(d => setCustomer(d));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyzeChat = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/customers/${id}/ai-analysis`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setAiProfile(data);
      else alert(data.error || "Failed to analyze chat.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToChat = () => {
    if (!aiProfile?.suggestedReply) return;
    const input = document.getElementById('wa-message-input') as HTMLInputElement;
    if (input) {
      input.value = aiProfile.suggestedReply;
      input.focus();
    }
  };

  if (!customer) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>{customer.name}</Typography>
          <Typography color="textSecondary">{customer.phone} • {customer.pipelineStage?.name || "No Stage"}</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Tasks Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Tasks</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Create Follow-up Task</Typography>
              <TextField 
                size="small" 
                label="Task Description" 
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)} 
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  size="small" 
                  type="date" 
                  fullWidth 
                  slotProps={{ inputLabel: { shrink: true } }}
                  label="Due Date"
                  value={taskDueDate} 
                  onChange={(e) => setTaskDueDate(e.target.value)} 
                />
                <Select 
                  size="small" 
                  displayEmpty 
                  fullWidth 
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                >
                  <MenuItem value="" disabled>Assign To...</MenuItem>
                  {users.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Button variant="contained" onClick={handleCreateTask} disabled={!taskTitle || !assignedUserId}>
                Add Task
              </Button>
            </Box>

            <List>
              {customer.tasks?.map((t: any) => (
                <ListItem key={t.id} divider>
                  <ListItemText 
                    primary={<Typography sx={{ textDecoration: t.isCompleted ? 'line-through' : 'none' }}>{t.title}</Typography>}
                    secondary={`Assigned to: ${t.user?.name} | Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}`}
                  />
                </ListItem>
              ))}
              {customer.tasks?.length === 0 && <Typography color="textSecondary">No tasks yet.</Typography>}
            </List>
          </Paper>

          {/* AI Sales Assistant Panel */}
          <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(to right bottom, #f3f4f6, #ffffff)', border: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="secondary" /> AI Sales Assistant
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                color="secondary" 
                onClick={handleAnalyzeChat} 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Chat"}
              </Button>
            </Box>

            {!aiProfile && !isAnalyzing && (
              <Typography color="textSecondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                Click "Analyze Chat" to let AI read the conversation and extract insights.
              </Typography>
            )}

            {isAnalyzing && <LinearProgress color="secondary" sx={{ mb: 2 }} />}

            {aiProfile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Interest Level</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiProfile.interestLevel || 0} 
                        color={(aiProfile.interestLevel || 0) > 70 ? 'success' : (aiProfile.interestLevel || 0) > 40 ? 'warning' : 'error'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{aiProfile.interestLevel}%</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {aiProfile.budget && aiProfile.budget !== "Unknown" && (
                    <Chip label={`Budget: ${aiProfile.budget}`} size="small" color="success" variant="outlined" />
                  )}
                  {aiProfile.nextSteps && (
                    <Chip label={`Next: ${aiProfile.nextSteps}`} size="small" color="primary" variant="outlined" />
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Summary</Typography>
                  <Typography variant="body2">{aiProfile.summary}</Typography>
                </Box>

                {aiProfile.suggestedReply && (
                  <Box sx={{ bgcolor: '#f0fdf4', p: 1.5, borderRadius: 1, border: '1px solid #bbf7d0', position: 'relative' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Suggested Reply:</Typography>
                    <Typography variant="body2" sx={{ color: '#15803d', pr: 4 }}>{aiProfile.suggestedReply}</Typography>
                    <Tooltip title="Copy to Chat">
                      <IconButton size="small" onClick={copyToChat} sx={{ position: 'absolute', top: 8, right: 8, color: '#166534' }}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Conversations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>WhatsApp Chat</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, mb: 2, minHeight: 300, bgcolor: '#e5ddd5', p: 2, borderRadius: 1 }}>
              {customer.conversations?.[0]?.messages?.map((msg: any) => (
                <Box 
                  key={msg.id} 
                  sx={{ 
                    alignSelf: msg.direction === 'OUTBOUND' ? 'flex-end' : 'flex-start',
                    bgcolor: msg.direction === 'OUTBOUND' ? '#dcf8c6' : '#ffffff',
                    p: 1.5, 
                    borderRadius: 2,
                    maxWidth: '80%',
                    boxShadow: 1
                  }}
                >
                  <Typography variant="body1">{msg.content}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))}
              {(!customer.conversations || customer.conversations.length === 0 || customer.conversations[0].messages.length === 0) && (
                <Typography color="textSecondary" align="center" sx={{ mt: 'auto', mb: 'auto' }}>
                  No messages yet. Start the conversation!
                </Typography>
              )}
            </Box>

            {/* Chat Input */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a message..."
                id="wa-message-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      const val = input.value;
                      input.value = '';
                      fetch("/api/messages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ customerId: id, content: val })
                      }).then(() => {
                        fetch(`/api/customers/${id}`).then(r => r.json()).then(d => setCustomer(d));
                      });
                    }
                  }
                }}
              />
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  const input = document.getElementById('wa-message-input') as HTMLInputElement;
                  if (input.value.trim()) {
                    const val = input.value;
                    input.value = '';
                    fetch("/api/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ customerId: id, content: val })
                    }).then(() => {
                      fetch(`/api/customers/${id}`).then(r => r.json()).then(d => setCustomer(d));
                    });
                  }
                }}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
