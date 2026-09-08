import { useEffect, useState } from "react";
import axios from "axios";
import EntityTable from "../../components/EntityTable";
import CustomSnackbar from "../../components/CustomSnackbar";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

const emptyEntry = {
  moduleName: "",
  oldPrice: "",
  newPrice: "",
  changeDate: "",
  changedBy: "",
  reason: "",
};

const toTablePricingHistory = (row) => ({
  Id: row.id ?? row.Id,
  ModuleName: row.moduleName ?? row.ModuleName ?? "",
  OldPrice: row.oldPrice ?? row.OldPrice ?? null,
  NewPrice: row.newPrice ?? row.NewPrice ?? null,
  ChangeDate: row.changeDate ?? row.ChangeDate ?? "",
  ChangedBy: row.changedBy ?? row.ChangedBy ?? "",
  Reason: row.reason ?? row.Reason ?? "",
});

export default function SubscriptionPricingHistoryPage() {
  const [history, setHistory] = useState([]);
  const [modules, setModules] = useState([]);
  const [apiError, setApiError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyEntry);
  const [moduleFilter, setModuleFilter] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const loadHistory = (filterModuleName) => {
    axios
      .get("/api/pricing-history", {
        params: filterModuleName ? { moduleName: filterModuleName } : {},
      })
      .then(({ data }) => setHistory((data || []).map(toTablePricingHistory)))
      .catch(() =>
        setApiError("Could not load pricing history from the database."),
      );
  };

  useEffect(() => {
    loadHistory(moduleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter]);

  useEffect(() => {
    axios
      .get("/api/modules")
      .then(({ data }) => setModules(data || []))
      .catch(() => {
        // Non-fatal for the filter dropdown.
      });
  }, []);

  const openAddDialog = () => {
    setApiError("");
    setForm(emptyEntry);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setForm(emptyEntry);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!form.moduleName || form.newPrice === "") return;
    setApiError("");

    const request = {
      moduleName: form.moduleName,
      oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
      newPrice: Number(form.newPrice),
      changeDate: form.changeDate || null,
      changedBy: form.changedBy || null,
      reason: form.reason || null,
    };

    try {
      const { data } = await axios.post("/api/pricing-history", request);
      setHistory((current) => [...current, toTablePricingHistory(data)]);
      setSnackbar({
        open: true,
        message: "Pricing history entry recorded successfully!",
        severity: "success",
      });
      closeDialog();
    } catch (error) {
      const msg =
        error.response?.data?.error ??
        "Could not record the pricing history entry.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const columns = [
    { key: "ModuleName", label: "Module", sortable: true, minWidth: 180 },
    { key: "OldPrice", label: "Old Price", sortable: true, minWidth: 120 },
    { key: "NewPrice", label: "New Price", sortable: true, minWidth: 120 },
    { key: "ChangeDate", label: "Change Date", sortable: true, minWidth: 140 },
    { key: "ChangedBy", label: "Changed By", sortable: true, minWidth: 150 },
    { key: "Reason", label: "Reason", minWidth: 220 },
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
          flexWrap: "wrap",
        }}
      >
        <h1 className="page-heading page-heading__text">
          Subscription Pricing History
        </h1>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            select
            size="small"
            label="Filter by Module"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Modules</MenuItem>
            {modules.map((m) => {
              const name = m.moduleName ?? m.ModuleName;
              return (
                <MenuItem key={m.id ?? m.Id} value={name}>
                  {name}
                </MenuItem>
              );
            })}
          </TextField>
          <Button
            variant="contained"
            startIcon={
              <img
                src="/logo/add.png"
                alt="Add"
                style={{ width: 20, height: 20 }}
              />
            }
            onClick={openAddDialog}
          >
            Add Entry
          </Button>
        </Box>
      </Box>

      <EntityTable title="" columns={columns} rows={history} />

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
        PaperProps={{ component: "form", onSubmit: saveEntry }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          Add Pricing History Entry
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
              select
              required
              label="Module"
              name="moduleName"
              value={form.moduleName}
              onChange={updateField}
              sx={{ gridColumn: { sm: "1 / span 2" } }}
            >
              {modules.map((m) => {
                const name = m.moduleName ?? m.ModuleName;
                return (
                  <MenuItem key={m.id ?? m.Id} value={name}>
                    {name}
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              label="Old Price"
              name="oldPrice"
              type="number"
              value={form.oldPrice}
              onChange={updateField}
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              required
              label="New Price"
              name="newPrice"
              type="number"
              value={form.newPrice}
              onChange={updateField}
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Change Date"
              name="changeDate"
              type="date"
              value={form.changeDate}
              onChange={updateField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Changed By"
              name="changedBy"
              value={form.changedBy}
              onChange={updateField}
            />
            <TextField
              label="Reason"
              name="reason"
              value={form.reason}
              onChange={updateField}
              sx={{ gridColumn: { sm: "1 / span 2" } }}
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
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
