import { useEffect, useState } from "react";
import axios from "axios";
import EntityTable from "../components/EntityTable";
import CustomSnackbar from "../components/CustomSnackbar";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

const emptyModule = { pillar: "", moduleName: "", price: "" };

const toTableModule = (module) => ({
  Id: module.id ?? module.Id,
  Pillar: module.pillar ?? module.Pillar ?? "",
  ModuleName:
    module.moduleName ??
    module.ModuleName ??
    module.module ??
    module.Module ??
    "",
  Price: module.price ?? module.Price ?? null,
});

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [form, setForm] = useState(emptyModule);
  const [apiError, setApiError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/modules")
      .then((response) => {
        if (!cancelled) setModules((response.data || []).map(toTableModule));
      })
      .catch(() => {
        if (!cancelled)
          setApiError("Could not load modules from the database.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAddDialog = () => {
    setApiError("");
    setEditingModuleId(null);
    setForm(emptyModule);
    setIsDialogOpen(true);
  };

  const openEditDialog = (module) => {
    setApiError("");
    setEditingModuleId(module.Id);
    setForm({
      pillar: module.Pillar,
      moduleName: module.ModuleName,
      price: module.Price ?? module.price ?? "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingModuleId(null);
    setForm(emptyModule);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveModule = async (event) => {
    event.preventDefault();
    if (!form.pillar || !form.moduleName) return;
    setApiError("");

    const request = {
      pillar: form.pillar,
      moduleName: form.moduleName,
      price: form.price === "" ? null : Number(form.price),
    };

    if (editingModuleId === null) {
      try {
        const { data } = await axios.post("/api/modules", request);
        const newModule = toTableModule(data);
        setModules((current) => [...current, newModule]);
        setSnackbar({
          open: true,
          message: `Module "${newModule.ModuleName}" created successfully!`,
          severity: "success",
        });
      } catch (error) {
        const msg =
          error.response?.data?.error ??
          "Could not create the module in the database.";
        setApiError(msg);
        setSnackbar({ open: true, message: msg, severity: "error" });
        return;
      }
    } else {
      try {
        const { data } = await axios.put(
          `/api/modules/${editingModuleId}`,
          request,
        );
        const updatedModule = toTableModule(data);
        setModules((current) =>
          current.map((currentModule) =>
            currentModule.Id === editingModuleId
              ? updatedModule
              : currentModule,
          ),
        );
        setSnackbar({
          open: true,
          message: `Module "${updatedModule.ModuleName}" updated successfully!`,
          severity: "success",
        });
      } catch (error) {
        const msg =
          error.response?.data?.error ??
          "Could not update the module in the database.";
        setApiError(msg);
        setSnackbar({ open: true, message: msg, severity: "error" });
        return;
      }
    }
    closeDialog();
  };

  const handleRemoveModule = (module) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemoveModule = async () => {
    if (!moduleToDelete) return;
    setApiError("");
    try {
      await axios.delete(`/api/modules/${moduleToDelete.Id}`);
      setModules((current) =>
        current.filter((module) => module.Id !== moduleToDelete.Id),
      );
      setSnackbar({
        open: true,
        message: `Module "${moduleToDelete.ModuleName}" deleted successfully!`,
        severity: "success",
      });
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ??
          "Could not delete the module from the database.",
        severity: "error",
      });
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setModuleToDelete(null);
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const moduleColumns = [
    { key: "Id", label: "Id", sortable: true, minWidth: 80 },
    { key: "Pillar", label: "Pillar", sortable: true, minWidth: 160 },
    { key: "ModuleName", label: "Module Name", sortable: true, minWidth: 220 },
    { key: "Price", label: "Price", sortable: true, minWidth: 120 },
    {
      key: "actions",
      label: "Actions",
      minWidth: 100,
      render: ({ row: module }) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <IconButton
            aria-label={`Edit ${module.ModuleName}`}
            size="small"
            onClick={() => openEditDialog(module)}
          >
            <img src="/logo/edit.png" alt="Edit" style={{ width: 18, height: 18 }} />
          </IconButton>
          <IconButton
            aria-label={`Delete ${module.ModuleName}`}
            size="small"
            onClick={() => handleRemoveModule(module)}
          >
            <img src="/logo/danger.png" alt="Delete" style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Modules Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<img src="/logo/add.png" alt="Add" style={{ width: 20, height: 20 }} />}
          onClick={openAddDialog}
        >
          Add Module
        </Button>
      </Box>

      <EntityTable title="" columns={moduleColumns} rows={modules} />

      {apiError && (
        <Typography color="error" sx={{ mt: 1 }}>
          {apiError}
        </Typography>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ component: "form", onSubmit: saveModule }}
      >
        <DialogTitle
          sx={{
            background: "var(--primary-gradient)",
            color: "white",
            px: 3,
            py: 2,
            mb: 2,
            borderTopLeftRadius: "var(--radius-md)",
            borderTopRightRadius: "var(--radius-md)",
          }}
        >
          {editingModuleId === null ? "Add Module" : "Edit Module"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              required
              label="Pillar"
              name="pillar"
              value={form.pillar}
              onChange={updateField}
            />
            <TextField
              required
              label="Module"
              name="moduleName"
              value={form.moduleName}
              onChange={updateField}
            />
            <TextField
              label="Price"
              name="price"
              type="number"
              value={form.price}
              onChange={updateField}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {editingModuleId === null ? "Create" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            paddingTop: "1vh",
          },
        }}
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "white",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            py: 1.5,
          }}
        >
          Confirm Delete Module
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to delete the module{" "}
            <strong>{moduleToDelete?.ModuleName}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              bgcolor: "#757575",
              color: "white",
              "&:hover": { bgcolor: "#757575" },
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmRemoveModule} variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        message={snackbar.message}
      />
    </Box>
  );
}
