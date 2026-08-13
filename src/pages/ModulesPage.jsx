import React, { useState, useEffect } from "react";
import axios from "axios";
import EntityTable from "../components/EntityTable";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function ModulesPage() {
  const [items, setItems] = useState([]);
  const [pillar, setPillar] = useState("");
  const [moduleName, setModuleName] = useState("");

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/modules")
      .then((r) => {
        if (!cancelled) setItems(r.data || []);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("modules_master");
          if (raw) setItems(JSON.parse(raw));
        } catch {}
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("modules_master", JSON.stringify(items));
  }, [items]);

  const add = async () => {
    if (!pillar || !moduleName)
      return alert("Both pillar and module name required");
    const newItem = { id: Date.now(), Pillar: pillar, Module: moduleName };
    try {
      await axios.post("/api/modules", newItem);
    } catch (e) {
      // ignore if endpoint missing
    }
    setItems((s) => [...s, newItem]);
    setPillar("");
    setModuleName("");
  };

  const remove = (id) => setItems((s) => s.filter((i) => i.id !== id));
  const startEdit = (id) =>
    setItems((s) => s.map((i) => ({ ...i, editing: i.id === id })));
  const saveEdit = (id, newPillar, newModule) =>
    setItems((s) =>
      s.map((i) =>
        i.id === id
          ? { ...i, Pillar: newPillar, Module: newModule, editing: false }
          : i,
      ),
    );

  const columns = [
    { key: "Pillar", label: "Pillar", sortable: true },
    { key: "Module", label: "Module", sortable: true },
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

  const rows = items.map((i) => ({
    id: i.id ?? `${i.Pillar}-${i.Module}`,
    Pillar: i.Pillar,
    Module: i.Module,
  }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Modules Master</h2>
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Pillar"
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
        />
        <TextField
          size="small"
          placeholder="Module"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
        />
        <Button variant="contained" size="small" onClick={add}>
          Add Module
        </Button>
      </Box>

      <EntityTable title="Modules" columns={columns} rows={rows} />
    </div>
  );
}
