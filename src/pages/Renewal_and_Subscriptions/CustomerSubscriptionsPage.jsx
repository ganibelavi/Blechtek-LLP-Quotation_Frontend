import { useEffect, useState } from "react";
import axios from "axios";
import EntityTable from "../../components/EntityTable";
import CustomSnackbar from "../../components/CustomSnackbar";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

const STATUS_OPTIONS = ["Active", "Expired", "Cancelled"];

const emptySubscription = {
  customerName: "",
  moduleName: "",
  purchaseDate: "",
  subscriptionStartDate: "",
  subscriptionEndDate: "",
  currentSubscriptionYear: "",
  nextRenewalDate: "",
  status: "Active",
};

const toTableSubscription = (sub) => ({
  Id: sub.id ?? sub.Id,
  CustomerName: sub.customerName ?? sub.CustomerName ?? "",
  ModuleName: sub.moduleName ?? sub.ModuleName ?? "",
  PurchaseDate: sub.purchaseDate ?? sub.PurchaseDate ?? "",
  SubscriptionStartDate:
    sub.subscriptionStartDate ?? sub.SubscriptionStartDate ?? "",
  SubscriptionEndDate:
    sub.subscriptionEndDate ?? sub.SubscriptionEndDate ?? "",
  CurrentSubscriptionYear:
    sub.currentSubscriptionYear ?? sub.CurrentSubscriptionYear ?? null,
  NextRenewalDate: sub.nextRenewalDate ?? sub.NextRenewalDate ?? "",
  Status: sub.status ?? sub.Status ?? "Active",
});

const statusChipColor = (status) => {
  switch (status) {
    case "Active":
      return { bgcolor: "#e6f4ea", color: "#1e7e34" };
    case "Expired":
      return { bgcolor: "#fdecea", color: "#c62828" };
    case "Cancelled":
      return { bgcolor: "#f1f1f1", color: "#616161" };
    default:
      return { bgcolor: "#f1f1f1", color: "#616161" };
  }
};

export default function CustomerSubscriptionsPage({ onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySubscription);
  const [apiError, setApiError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/customer-subscriptions")
      .then((response) => {
        if (!cancelled)
          setSubscriptions((response.data || []).map(toTableSubscription));
      })
      .catch(() => {
        if (!cancelled)
          setApiError("Could not load customer subscriptions from the database.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAddDialog = () => {
    setApiError("");
    setEditingId(null);
    setForm(emptySubscription);
    setIsDialogOpen(true);
  };

  const openEditDialog = (sub) => {
    setApiError("");
    setEditingId(sub.Id);
    setForm({
      customerName: sub.CustomerName,
      moduleName: sub.ModuleName,
      purchaseDate: sub.PurchaseDate ? sub.PurchaseDate.slice(0, 10) : "",
      subscriptionStartDate: sub.SubscriptionStartDate
        ? sub.SubscriptionStartDate.slice(0, 10)
        : "",
      subscriptionEndDate: sub.SubscriptionEndDate
        ? sub.SubscriptionEndDate.slice(0, 10)
        : "",
      currentSubscriptionYear: sub.CurrentSubscriptionYear ?? "",
      nextRenewalDate: sub.NextRenewalDate
        ? sub.NextRenewalDate.slice(0, 10)
        : "",
      status: sub.Status ?? "Active",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setForm(emptySubscription);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveSubscription = async (event) => {
    event.preventDefault();
    if (!form.customerName || !form.moduleName) return;
    setApiError("");

    const request = {
      customerName: form.customerName,
      moduleName: form.moduleName,
      purchaseDate: form.purchaseDate || null,
      subscriptionStartDate: form.subscriptionStartDate || null,
      subscriptionEndDate: form.subscriptionEndDate || null,
      currentSubscriptionYear:
        form.currentSubscriptionYear === ""
          ? null
          : Number(form.currentSubscriptionYear),
      nextRenewalDate: form.nextRenewalDate || null,
      status: form.status,
    };

    try {
      if (editingId === null) {
        const { data } = await axios.post(
          "/api/customer-subscriptions",
          request,
        );
        const newSub = toTableSubscription(data);
        setSubscriptions((current) => [...current, newSub]);
        setSnackbar({
          open: true,
          message: `Subscription for "${newSub.CustomerName}" created successfully!`,
          severity: "success",
        });
      } else {
        const { data } = await axios.put(
          `/api/customer-subscriptions/${editingId}`,
          request,
        );
        const updatedSub = toTableSubscription(data);
        setSubscriptions((current) =>
          current.map((s) => (s.Id === editingId ? updatedSub : s)),
        );
        setSnackbar({
          open: true,
          message: `Subscription for "${updatedSub.CustomerName}" updated successfully!`,
          severity: "success",
        });
      }
      closeDialog();
    } catch (error) {
      const msg =
        error.response?.data?.error ??
        "Could not save the subscription to the database.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleRemoveSubscription = (sub) => {
    setSubscriptionToDelete(sub);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemoveSubscription = async () => {
    if (!subscriptionToDelete) return;
    try {
      await axios.delete(
        `/api/customer-subscriptions/${subscriptionToDelete.Id}`,
      );
      setSubscriptions((current) =>
        current.filter((s) => s.Id !== subscriptionToDelete.Id),
      );
      setSnackbar({
        open: true,
        message: `Subscription for "${subscriptionToDelete.CustomerName}" deleted successfully!`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ??
          "Could not delete the subscription from the database.",
        severity: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSubscriptionToDelete(null);
  };

  const columns = [
    { key: "Id", label: "Id", sortable: true, minWidth: 70 },
    { key: "CustomerName", label: "Customer", sortable: true, minWidth: 180 },
    { key: "ModuleName", label: "Module", sortable: true, minWidth: 180 },
    { key: "PurchaseDate", label: "Purchase Date", sortable: true, minWidth: 140 },
    {
      key: "SubscriptionStartDate",
      label: "Start Date",
      sortable: true,
      minWidth: 130,
    },
    {
      key: "SubscriptionEndDate",
      label: "End Date",
      sortable: true,
      minWidth: 130,
    },
    {
      key: "CurrentSubscriptionYear",
      label: "Current Year",
      sortable: true,
      minWidth: 120,
    },
    {
      key: "NextRenewalDate",
      label: "Next Renewal",
      sortable: true,
      minWidth: 140,
    },
    {
      key: "Status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      render: ({ row }) => (
        <Chip
          label={row.Status}
          size="small"
          sx={{ fontWeight: 600, ...statusChipColor(row.Status) }}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      minWidth: 130,
      render: ({ row: sub }) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <IconButton
            aria-label={`View ${sub.CustomerName}`}
            size="small"
            onClick={() => onNavigate?.("subscription-details", undefined, undefined, sub.Id)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Edit ${sub.CustomerName}`}
            size="small"
            onClick={() => openEditDialog(sub)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${sub.CustomerName}`}
            size="small"
            onClick={() => handleRemoveSubscription(sub)}
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
        <h1 className="page-heading page-heading__text">
          Customer Subscriptions
        </h1>
        <Button
          variant="contained"
          startIcon={
            <img src="/logo/add.png" alt="Add" style={{ width: 20, height: 20 }} />
          }
          onClick={openAddDialog}
        >
          Add Subscription
        </Button>
      </Box>

      <EntityTable title="" columns={columns} rows={subscriptions} />

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
        PaperProps={{ component: "form", onSubmit: saveSubscription }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          {editingId === null ? "Add Subscription" : "Edit Subscription"}
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
              label="Customer Name"
              name="customerName"
              value={form.customerName}
              onChange={updateField}
            />
            <TextField
              required
              label="Module Name"
              name="moduleName"
              value={form.moduleName}
              onChange={updateField}
            />
            <TextField
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={updateField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Current Subscription Year"
              name="currentSubscriptionYear"
              type="number"
              value={form.currentSubscriptionYear}
              onChange={updateField}
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label="Subscription Start Date"
              name="subscriptionStartDate"
              type="date"
              value={form.subscriptionStartDate}
              onChange={updateField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Subscription End Date"
              name="subscriptionEndDate"
              type="date"
              value={form.subscriptionEndDate}
              onChange={updateField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Next Renewal Date"
              name="nextRenewalDate"
              type="date"
              value={form.nextRenewalDate}
              onChange={updateField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Status"
              name="status"
              value={form.status}
              onChange={updateField}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {editingId === null ? "Create" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-container": { alignItems: "flex-start", paddingTop: "1vh" },
        }}
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            color: "white",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            py: 1.5,
          }}
        >
          Confirm Delete Subscription
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, fontSize: "14px" }}>
            Are you sure you want to delete the subscription for{" "}
            <strong>{subscriptionToDelete?.CustomerName}</strong> (
            {subscriptionToDelete?.ModuleName})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDeleteDialog} sx={dialogSecondaryActionSx}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoveSubscription}
            variant="contained"
            sx={dialogPrimaryActionSx}
          >
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
