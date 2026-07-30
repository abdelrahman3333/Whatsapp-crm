"use client";

import { useState, useEffect } from "react";
import { 
  Typography, Box, Paper, Grid, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({ name: '', trigger: 'NEW_LEAD', condition: '', messageTemplate: '' });

  const loadRules = () => {
    fetch("/api/automations")
      .then(res => res.json())
      .then(data => setRules(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSave = async () => {
    await fetch("/api/automations", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    setOpen(false);
    setFormData({ name: '', trigger: 'NEW_LEAD', condition: '', messageTemplate: '' });
    loadRules();
  };

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !current })
    });
    loadRules();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      await fetch(`/api/automations/${id}`, { method: "DELETE" });
      loadRules();
    }
  };

  const handleTestCron = async () => {
    setIsTesting(true);
    try {
      await fetch("/api/cron/automations");
      alert("Automations check completed! Any pending messages have been sent.");
      loadRules(); // reload to update sent counts
    } catch (e) {
      alert("Failed to run automations.");
    }
    setIsTesting(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon fontSize="large" color="primary" /> WhatsApp Automations
          </Typography>
          <Typography color="textSecondary">Automate your outreach and save time.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleTestCron}
            disabled={isTesting}
          >
            {isTesting ? "Running..." : "Run Automations Now (Test)"}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ bgcolor: '#00a884', '&:hover': { bgcolor: '#008f6f' } }}>
            Create Rule
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Rule Name</strong></TableCell>
              <TableCell><strong>Trigger</strong></TableCell>
              <TableCell><strong>Sent Count</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No automation rules found.</TableCell>
              </TableRow>
            ) : rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={rule.trigger.replace(/_/g, ' ')} 
                    size="small" 
                    color={rule.trigger === 'NEW_LEAD' ? 'primary' : 'secondary'} 
                  />
                  {rule.condition && <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>({rule.condition.replace('_', ' ')})</Typography>}
                </TableCell>
                <TableCell>{rule._count?.logs || 0}</TableCell>
                <TableCell>
                  <Chip 
                    label={rule.isActive ? 'Active' : 'Paused'} 
                    color={rule.isActive ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => toggleStatus(rule.id, rule.isActive)} color={rule.isActive ? "warning" : "success"}>
                    {rule.isActive ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                  <IconButton onClick={() => handleDelete(rule.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Automation Rule</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField 
            label="Rule Name" 
            fullWidth 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          
          <FormControl fullWidth>
            <InputLabel>Trigger</InputLabel>
            <Select 
              value={formData.trigger} 
              label="Trigger"
              onChange={(e) => setFormData({...formData, trigger: e.target.value, condition: ''})}
            >
              <MenuItem value="NEW_LEAD">New Lead (Sent Immediately)</MenuItem>
              <MenuItem value="TIME_BASED_FOLLOWUP">Time-Based Follow Up</MenuItem>
              <MenuItem value="NO_REPLY">No Reply Reminder</MenuItem>
            </Select>
          </FormControl>

          {(formData.trigger === 'TIME_BASED_FOLLOWUP' || formData.trigger === 'NO_REPLY') && (
            <FormControl fullWidth>
              <InputLabel>Wait Time</InputLabel>
              <Select 
                value={formData.condition} 
                label="Wait Time"
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
              >
                <MenuItem value="1_days">1 Day</MenuItem>
                <MenuItem value="2_days">2 Days</MenuItem>
                <MenuItem value="3_days">3 Days</MenuItem>
                <MenuItem value="7_days">7 Days</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField 
            label="Message Template" 
            fullWidth 
            multiline 
            rows={4}
            value={formData.messageTemplate} 
            onChange={(e) => setFormData({...formData, messageTemplate: e.target.value})} 
            helperText="Use {{customer_name}} to personalize the message."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#00a884', '&:hover': { bgcolor: '#008f6f' } }}>
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
