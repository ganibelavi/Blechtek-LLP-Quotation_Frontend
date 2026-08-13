import React, { useState, useEffect } from "react";
import axios from "axios";
import EntityTable from "../components/EntityTable";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function UsersPage() {
  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem("users_master");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    localStorage.setItem("users_master", JSON.stringify(users));
  }, [users]);

  const createUser = async () => {
    if (!email || !password) return alert("Email and password required");
    try {
      await axios.post("/api/auth/register", { email, password });
    } catch (err) {
      // ignore backend errors (endpoint may not exist)
    }
    setUsers((s) => [...s, { id: Date.now(), email }]);
    setEmail("");
    setPassword("");
  };

  const remove = (id) => setUsers((s) => s.filter((u) => u.id !== id));

  const startEdit = (id) =>
    setUsers((s) => s.map((u) => ({ ...u, editing: u.id === id })));

  const saveEdit = (id, newEmail) =>
    setUsers((s) =>
      s.map((u) =>
        u.id === id ? { ...u, email: newEmail, editing: false } : u,
      ),
    );

  const columns = [
    { key: "email", label: "Email", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Box>
          <IconButton size="small" onClick={() => startEdit(row.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => remove(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows = users.map((u) => ({ id: u.id, email: u.email }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Users Master</h2>
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          size="small"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button variant="contained" size="small" onClick={createUser}>
          Create
        </Button>
      </Box>

      <EntityTable title="Users" columns={columns} rows={rows} />
    </div>
  );
}
