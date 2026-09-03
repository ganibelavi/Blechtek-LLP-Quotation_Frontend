import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EntityTable from "../../../components/EntityTable";
import CustomSnackbar from "../../../components/CustomSnackbar";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../../styles/modalActionButtonStyles";

const emptySnackbar = { open: false, message: "", severity: "success" };

export default function MasterCrudPage({ title, endpoint, fields, columns }) {
  const emptyForm = useMemo(
    () =>
      fields.reduce(
        (result, field) => ({
          ...result,
          [field.name]: field.defaultValue ?? "",
        }),
        {},
      ),
    [fields],
  );
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState(emptySnackbar);

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/${endpoint}`);
      setRows(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      console.error(requestError);
      setError(`Could not load ${title.toLowerCase()} from the database.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setEditingId(row.id);
    setForm(
      fields.reduce(
        (result, field) => ({
          ...result,
          [field.name]: row[field.name] ?? field.defaultValue ?? "",
        }),
        {},
      ),
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveRow = async (event) => {
    event.preventDefault();
    const missingRequired = fields.some(
      (field) => field.required && !String(form[field.name] ?? "").trim(),
    );
    if (missingRequired) return;

    try {
      setLoading(true);
      const request = fields.reduce((result, field) => {
        let value = form[field.name];
        if (field.type === "number" && value !== "") value = Number(value);
        return { ...result, [field.name]: value };
      }, {});
      if (editingId === null) {
        await axios.post(`/api/${endpoint}`, request);
        setSnackbar({
          open: true,
          message: `${title} created successfully.`,
          severity: "success",
        });
      } else {
        await axios.put(`/api/${endpoint}/${editingId}`, request);
        setSnackbar({
          open: true,
          message: `${title} updated successfully.`,
          severity: "success",
        });
      }
      await loadRows();
      closeDialog();
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.response?.data ||
        `Could not save ${title.toLowerCase()}.`;
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      setLoading(true);
      await axios.delete(`/api/${endpoint}/${rowToDelete.id}`);
      setRows((current) => current.filter((row) => row.id !== rowToDelete.id));
      setSnackbar({
        open: true,
        message: `${title} deleted successfully.`,
        severity: "success",
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        `Could not delete ${title.toLowerCase()}.`;
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  const tableColumns = [
    { key: "id", label: "Id", sortable: true, minWidth: 70 },
    ...columns,
    {
      key: "actions",
      label: "Actions",
      minWidth: 100,
      render: ({ row }) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <IconButton
            aria-label={`Edit ${title}`}
            size="small"
            onClick={() => openEditDialog(row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${title}`}
            size="small"
            onClick={() => {
              setRowToDelete(row);
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon fontSize="small" />
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
          mb: 2.5,
          gap: 2,
        }}
      >
        <h1 className="page-heading page-heading__text">{title}</h1>
        <Button variant="contained" onClick={openAddDialog}>
          Add {title.replace(/s$/, "")}
        </Button>
      </Box>
      <EntityTable title="" columns={tableColumns} rows={rows} />
      {loading && (
        <Typography sx={{ mt: 1 }} color="text.secondary">
          Loading...
        </Typography>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{ component: "form", onSubmit: saveRow }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          {editingId === null
            ? `Add ${title.replace(/s$/, "")}`
            : `Edit ${title.replace(/s$/, "")}`}
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
            {fields.map((field) =>
              field.type === "select" ? (
                <Select
                  key={field.name}
                  name={field.name}
                  value={form[field.name]}
                  onChange={updateField}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    {field.label}
                  </MenuItem>
                  {field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <TextField
                  key={field.name}
                  required={field.required}
                  label={field.label}
                  name={field.name}
                  type={field.type === "textarea" ? "text" : field.type}
                  multiline={field.type === "textarea"}
                  minRows={field.type === "textarea" ? 3 : undefined}
                  value={form[field.name]}
                  onChange={updateField}
                  inputProps={
                    field.type === "number"
                      ? { min: 0, step: "0.01" }
                      : undefined
                  }
                />
              ),
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} sx={dialogSecondaryActionSx}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={dialogPrimaryActionSx}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: "white",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            py: 1.5,
          }}
        >
          Confirm Delete {title.replace(/s$/, "")}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Are you sure you want to delete this{" "}
            {title.replace(/s$/, "").toLowerCase()}? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={dialogSecondaryActionSx}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={dialogPrimaryActionSx}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar(emptySnackbar)}
        severity={snackbar.severity}
        message={snackbar.message}
      />
    </Box>
  );
}
