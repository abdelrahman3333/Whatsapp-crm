"use client";

import { useState, useEffect } from "react";
import { 
  Typography, Box, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, TextField, Dialog, DialogActions, 
  DialogContent, DialogTitle, IconButton 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useRef } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  // New Customer Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${search}`);
      const data = await res.json();
      if (res.ok) setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleAddCustomer = async () => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone })
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        setPhone("");
        fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Skip header row if it contains text, map to { name, phone }
        const customers = data.slice(1)
          .map((row: any) => ({
            name: row[0],
            phone: row[1]
          }))
          .filter((c: any) => c.name && c.phone); // Require both

        const res = await fetch("/api/customers/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customers })
        });
        
        const resData = await res.json();
        
        if (res.ok) {
          alert(`Successfully imported ${resData.count} customers!`);
          fetchCustomers();
        } else {
          alert(`Import failed: ${resData.error}`);
        }
      } catch (error) {
        console.error(error);
        alert("Error parsing the file. Please ensure it's a valid Excel or CSV file.");
      }
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>Customers</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<UploadFileIcon />} 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import Excel"}
          </Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add Customer
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, bgcolor: "white" }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Stage</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.pipelineStage?.name || "No Stage"}</TableCell>
                <TableCell>
                  {c.aiProfile?.interestLevel !== undefined ? (
                    <span style={{ 
                      backgroundColor: c.aiProfile.interestLevel >= 75 ? '#fee2e2' : c.aiProfile.interestLevel >= 40 ? '#fef3c7' : '#e0f2fe',
                      color: c.aiProfile.interestLevel >= 75 ? '#991b1b' : c.aiProfile.interestLevel >= 40 ? '#92400e' : '#075985',
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>
                      {c.aiProfile.interestLevel >= 75 ? '🔥 Hot' : c.aiProfile.interestLevel >= 40 ? '🟡 Warm' : '❄️ Cold'}
                    </span>
                  ) : "-"}
                </TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/dashboard/customers/${c.id}`} color="primary">
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Customer Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
