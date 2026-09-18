import { useEffect, useState } from "react";
import axios from "axios";
import EntityTable from "../../components/EntityTable";
import CustomSnackbar from "../../components/CustomSnackbar";
import {
  Autocomplete,
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
import {
  fetchCustomerSubscriptions,
  fetchCustomers,
  fetchSubscriptionInvoices,
  fetchModules,
} from "../../services/quotationApi";
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
  invoiceId: "",
  invoiceLineItemId: "",
  quotationId: "",
  renewalPercentage: "",
  escalationPercentage: "",
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
  InvoiceId: sub.invoiceId ?? sub.InvoiceId ?? null,
  QuotationId: sub.quotationId ?? sub.QuotationId ?? "",
  RenewalPercentage:
    sub.renewalPercentage ?? sub.RenewalPercentage ?? null,
  EscalationPercentage:
    sub.escalationPercentage ?? sub.EscalationPercentage ?? null,
  PurchaseDate: sub.purchaseDate ?? sub.PurchaseDate ?? "",
  SubscriptionStartDate:
    sub.subscriptionStartDate ?? sub.SubscriptionStartDate ?? "",
  SubscriptionEndDate:
    sub.subscriptionEndDate ?? sub.SubscriptionEndDate ?? "",
  CurrentSubscriptionYear:
    sub.currentSubscriptionYear ?? sub.CurrentSubscriptionYear ?? null,
  NextRenewalDate: sub.nextRenewalDate ?? sub.NextRenewalDate ?? "",
  Status: normalizeStatus(sub.status ?? sub.Status),
});

const customerName = (customer) =>
  customer?.name ??
  customer?.Name ??
  customer?.customerName ??
  customer?.CustomerName ??
  "";

const customerId = (customer) => customer?.id ?? customer?.Id ?? null;

const moduleName = (module) =>
  module?.module ??
  module?.Module ??
  module?.moduleName ??
  module?.ModuleName ??
  "";

const invoiceItems = (invoice) => invoice?.items ?? invoice?.Items ?? [];

const normalizeStatus = (status) => {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "expired") return "Expired";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }
  return "Active";
};

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
  const [customerOptions, setCustomerOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
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
    fetchCustomerSubscriptions()
      .then((data) => {
        if (!cancelled) setSubscriptions(data.map(toTableSubscription));
      })
      .catch(() => {
        if (!cancelled)
          setApiError("Could not load customer subscriptions from the database.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCustomers(), fetchModules(), fetchSubscriptionInvoices()])
      .then(([customers, modules, invoices]) => {
        if (cancelled) return;
        setCustomerOptions(
          customers
            .map((customer) => ({
              id: customerId(customer),
              name: customerName(customer),
            }))
            .filter((customer) => customer.name)
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setModuleOptions(
          modules.map(moduleName).filter(Boolean).sort((a, b) => a.localeCompare(b)),
        );
        setInvoiceOptions(invoices || []);
      })
      .catch(() => {
        if (!cancelled) {
          setApiError("Could not load customers and modules from master data.");
        }
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
      invoiceId: sub.InvoiceId || "",
      invoiceLineItemId: "",
      quotationId: sub.QuotationId || "",
      renewalPercentage: sub.RenewalPercentage ?? "",
      escalationPercentage: sub.EscalationPercentage ?? "",
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
    const renewalPercentage = Number(form.renewalPercentage || 0);
    const escalationPercentage = Number(form.escalationPercentage || 0);
    if (
      renewalPercentage < 0 ||
      renewalPercentage > 100 ||
      escalationPercentage < 0 ||
      escalationPercentage > 100
    ) {
      const message = "Percentage values must be between 0 and 100.";
      setApiError(message);
      setSnackbar({ open: true, message, severity: "error" });
      return;
    }
    setApiError("");
    if (editingId === null && (!form.invoiceId || !form.invoiceLineItemId)) {
      const message = "Select a finalized invoice and invoice line item.";
      setApiError(message);
      setSnackbar({ open: true, message, severity: "error" });
      return;
    }

    const request = {
      customerName: form.customerName,
      moduleName: form.moduleName,
      invoiceId: form.invoiceId ? Number(form.invoiceId) : null,
      invoiceLineItemId: form.invoiceLineItemId
        ? Number(form.invoiceLineItemId)
        : null,
      quotationId: editingId === null ? null : form.quotationId || null,
      renewalPercentage:
        form.renewalPercentage === "" ? null : renewalPercentage,
      escalationPercentage:
        form.escalationPercentage === "" ? null : escalationPercentage,
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
          "/api/customer-subscriptions/from-invoice",
          request,
        );
        const newSub = toTableSubscription({
          ...data,
          renewalPercentage:
            data.renewalPercentage ??
            data.RenewalPercentage ??
            request.renewalPercentage,
          escalationPercentage:
            data.escalationPercentage ??
            data.EscalationPercentage ??
            request.escalationPercentage,
        });
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
        const updatedSub = toTableSubscription({
          ...data,
          renewalPercentage:
            data.renewalPercentage ??
            data.RenewalPercentage ??
            request.renewalPercentage,
          escalationPercentage:
            data.escalationPercentage ??
            data.EscalationPercentage ??
            request.escalationPercentage,
        });
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
      key: "InvoiceId",
      label: "Source Invoice",
      sortable: true,
      minWidth: 180,
    },
    {
      key: "RenewalPercentage",
      label: "Renewal %",
      sortable: true,
      minWidth: 110,
      render: ({ row }) =>
        row.RenewalPercentage == null ? "-" : `${row.RenewalPercentage}%`,
    },
    {
      key: "EscalationPercentage",
      label: "Escalation %",
      sortable: true,
      minWidth: 120,
      render: ({ row }) =>
        row.EscalationPercentage == null
          ? "-"
          : `${row.EscalationPercentage}%`,
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
          // startIcon={
          //   <img src="/logo/add.png" alt="Add" style={{ width: 20, height: 20 }} />
          // }
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
            <Autocomplete
              required
              options={customerOptions}
              value={
                customerOptions.find(
                  (customer) => customer.name === form.customerName,
                ) || null
              }
              onChange={(_event, value) =>
                setForm((current) => ({
                  ...current,
                  customerName: value?.name || "",
                  invoiceId: "",
                  invoiceLineItemId: "",
                  moduleName: "",
                }))
              }
              getOptionLabel={(customer) => customer?.name || ""}
              renderInput={(params) => (
                <TextField {...params} required label="Customer Name" />
              )}
            />
            <Autocomplete
              options={invoiceOptions.filter((invoice) => {
                const status = String(invoice.status ?? invoice.Status ?? "").toLowerCase();
                const selectedCustomer = customerOptions.find(
                  (customer) => customer.name === form.customerName,
                );
                return (
                  selectedCustomer &&
                  String(invoice.customerId ?? invoice.CustomerId) ===
                    String(selectedCustomer.id) &&
                  !["draft", "cancelled", "void"].includes(status)
                );
              })}
              value={
                invoiceOptions.find(
                  (invoice) => String(invoice.id ?? invoice.Id) === String(form.invoiceId),
                ) || null
              }
              onChange={(_event, value) =>
                setForm((current) => ({
                  ...current,
                  invoiceId: value?.id ?? value?.Id ?? "",
                  invoiceLineItemId: "",
                  moduleName: "",
                }))
              }
              getOptionLabel={(invoice) =>
                invoice
                  ? `${invoice.invoiceNo || invoice.InvoiceNo || invoice.id || invoice.Id} - ${invoice.invoiceDate || invoice.InvoiceDate ? new Date(invoice.invoiceDate || invoice.InvoiceDate).toLocaleDateString() : ""} - ${invoice.totalAmount ?? invoice.TotalAmount ?? ""}`
                  : ""
              }
              renderInput={(params) => (
                <TextField {...params} label="Source Invoice (finalized)" />
              )}
              isOptionEqualToValue={(option, value) =>
                String(option.id ?? option.Id) === String(value.id ?? value.Id)
              }
            />
            <Autocomplete
              options={invoiceItems(
                invoiceOptions.find(
                  (invoice) =>
                    String(invoice.id ?? invoice.Id) === String(form.invoiceId),
                ),
              )}
              value={
                invoiceItems(
                  invoiceOptions.find(
                    (invoice) =>
                      String(invoice.id ?? invoice.Id) === String(form.invoiceId),
                  ),
                ).find(
                  (item) =>
                    String(item.id ?? item.Id) === String(form.invoiceLineItemId),
                ) || null
              }
              onChange={(_event, value) => {
                const selectedModule =
                  value?.moduleName ??
                  value?.ModuleName ??
                  value?.description ??
                  value?.Description ??
                  "";
                setForm((current) => ({
                  ...current,
                  invoiceLineItemId: value?.id ?? value?.Id ?? "",
                  moduleName: selectedModule,
                }));
              }}
              getOptionLabel={(item) =>
                item
                  ? `${item.description ?? item.Description ?? ""} x${item.qty ?? item.Qty ?? 0} @ ${item.rate ?? item.Rate ?? 0}`
                  : ""
              }
              renderInput={(params) => (
                <TextField {...params} required label="Invoice Line Item" />
              )}
              isOptionEqualToValue={(option, value) =>
                String(option.id ?? option.Id) === String(value.id ?? value.Id)
              }
              disabled={!form.invoiceId}
            />
            <Autocomplete
              required
              options={[...new Set([...moduleOptions, form.moduleName].filter(Boolean))]}
              value={form.moduleName || null}
              onChange={(_event, value) =>
                setForm((current) => ({
                  ...current,
                  moduleName: value || "",
                }))
              }
              renderInput={(params) => (
                <TextField {...params} required label="Module Name" />
              )}
              freeSolo={false}
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
              label="Renewal Percentage (%)"
              name="renewalPercentage"
              type="number"
              value={form.renewalPercentage}
              onChange={updateField}
              inputProps={{ min: 0, max: 100, step: "0.01" }}
              helperText="Applied from renewal year 2"
            />
            <TextField
              label="Annual Escalation Percentage (%)"
              name="escalationPercentage"
              type="number"
              value={form.escalationPercentage}
              onChange={updateField}
              inputProps={{ min: 0, max: 100, step: "0.01" }}
              helperText="Applied from renewal year 3"
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
