import { useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

const emptyForm = {
  customerSubscriptionId: "",
  year: "",
};

const toTableQuotation = (row) => ({
  Id: row.id ?? row.Id,
  QuotationNumber: row.quotationNumber ?? row.QuotationNumber ?? "",
  CustomerName: row.customerName ?? row.CustomerName ?? "",
  ModuleName: row.moduleName ?? row.ModuleName ?? "",
  Year: row.year ?? row.Year,
  Amount: row.amount ?? row.Amount ?? null,
  Date: row.date ?? row.Date ?? "",
  Status: row.status ?? row.Status ?? "",
});

// Renewal amount = base (year 1) price, escalated by the escalation % for every
// year beyond the first, applied on top of the standard renewal %.
// This mirrors: amount = basePrice * (1 + renewalPct/100) * (1 + escalationPct/100)^(year-2)
const calculateRenewalAmount = (basePrice, renewalPct, escalationPct, year) => {
  if (!basePrice || !year || year < 2) return null;
  const renewed = basePrice * (1 + (renewalPct || 0) / 100);
  const yearsOfEscalation = year - 2;
  const escalated =
    renewed * Math.pow(1 + (escalationPct || 0) / 100, yearsOfEscalation);
  return Math.round(escalated * 100) / 100;
};

export default function RenewalQuotationPage() {
  const [quotations, setQuotations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [apiError, setApiError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    axios
      .get("/api/renewal-quotations")
      .then(({ data }) => setQuotations((data || []).map(toTableQuotation)))
      .catch(() =>
        setApiError("Could not load renewal quotations from the database."),
      );

    axios
      .get("/api/customer-subscriptions")
      .then(({ data }) => setSubscriptions(data || []))
      .catch(() => {
        // Non-fatal for the list view; surfaced when opening the dialog.
      });
  }, []);

  const openAddDialog = () => {
    setForm(emptyForm);
    setSelectedSubscription(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setForm(emptyForm);
    setSelectedSubscription(null);
  };

  const handleSubscriptionChange = (event) => {
    const id = event.target.value;
    const sub = subscriptions.find(
      (s) => String(s.id ?? s.Id) === String(id),
    );
    setSelectedSubscription(sub || null);
    setForm((current) => ({ ...current, customerSubscriptionId: id }));
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const computedAmount = useMemo(() => {
    if (!selectedSubscription || !form.year) return null;
    const basePrice =
      selectedSubscription.initialPurchaseAmount ??
      selectedSubscription.InitialPurchaseAmount;
    const renewalPct =
      selectedSubscription.renewalPercentage ??
      selectedSubscription.RenewalPercentage;
    const escalationPct =
      selectedSubscription.escalationPercentage ??
      selectedSubscription.EscalationPercentage;
    return calculateRenewalAmount(
      basePrice,
      renewalPct,
      escalationPct,
      Number(form.year),
    );
  }, [selectedSubscription, form.year]);

  const subscriptionPeriod = useMemo(() => {
    if (!selectedSubscription || !form.year) return null;
    const startDate = new Date(
      selectedSubscription.subscriptionStartDate ??
        selectedSubscription.SubscriptionStartDate,
    );
    if (Number.isNaN(startDate.getTime())) return null;
    const year = Number(form.year);
    const periodStart = new Date(startDate);
    periodStart.setFullYear(startDate.getFullYear() + (year - 1));
    const periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodStart.getFullYear() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
    return {
      start: periodStart.toISOString().slice(0, 10),
      end: periodEnd.toISOString().slice(0, 10),
    };
  }, [selectedSubscription, form.year]);

  const saveQuotation = async (event) => {
    event.preventDefault();
    if (!form.customerSubscriptionId || !form.year) return;
    setApiError("");

    const request = {
      customerSubscriptionId: form.customerSubscriptionId,
      year: Number(form.year),
      amount: computedAmount,
      periodStart: subscriptionPeriod?.start ?? null,
      periodEnd: subscriptionPeriod?.end ?? null,
    };

    try {
      const { data } = await axios.post("/api/renewal-quotations", request);
      const newQuotation = toTableQuotation(data);
      setQuotations((current) => [...current, newQuotation]);
      setSnackbar({
        open: true,
        message: `Renewal quotation "${newQuotation.QuotationNumber}" created successfully!`,
        severity: "success",
      });
      closeDialog();
    } catch (error) {
      const msg =
        error.response?.data?.error ?? "Could not create the renewal quotation.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const columns = [
    {
      key: "QuotationNumber",
      label: "Quotation #",
      sortable: true,
      minWidth: 150,
    },
    { key: "CustomerName", label: "Customer", sortable: true, minWidth: 180 },
    { key: "ModuleName", label: "Module", sortable: true, minWidth: 180 },
    { key: "Year", label: "Year", sortable: true, minWidth: 90 },
    { key: "Amount", label: "Amount", sortable: true, minWidth: 130 },
    { key: "Date", label: "Date", sortable: true, minWidth: 140 },
    {
      key: "Status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      render: ({ row }) => <Chip label={row.Status} size="small" />,
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
        <h1 className="page-heading page-heading__text">Renewal Quotations</h1>
        <Button
          variant="contained"
          startIcon={
            <img src="/logo/add.png" alt="Add" style={{ width: 20, height: 20 }} />
          }
          onClick={openAddDialog}
        >
          Create Quotation
        </Button>
      </Box>

      <EntityTable title="" columns={columns} rows={quotations} />

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
        PaperProps={{ component: "form", onSubmit: saveQuotation }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          Create Renewal Quotation
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
              label="Customer Subscription"
              name="customerSubscriptionId"
              value={form.customerSubscriptionId}
              onChange={handleSubscriptionChange}
              sx={{ gridColumn: { sm: "1 / span 2" } }}
            >
              {subscriptions.map((sub) => {
                const id = sub.id ?? sub.Id;
                const customerName = sub.customerName ?? sub.CustomerName;
                const moduleName = sub.moduleName ?? sub.ModuleName;
                return (
                  <MenuItem key={id} value={id}>
                    {customerName} — {moduleName}
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              required
              label="Renewal Year"
              name="year"
              type="number"
              value={form.year}
              onChange={updateField}
              inputProps={{ min: 2, step: 1 }}
              helperText="Year 2, 3, etc."
            />
          </Box>

          {selectedSubscription && form.year && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2.5, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Escalation applied:{" "}
                {selectedSubscription.escalationPercentage ??
                  selectedSubscription.EscalationPercentage ??
                  0}
                %
              </Typography>
              {subscriptionPeriod && (
                <Typography variant="body2" color="text.secondary">
                  Subscription period: {subscriptionPeriod.start} to{" "}
                  {subscriptionPeriod.end}
                </Typography>
              )}
              <Typography variant="h6" sx={{ mt: 1 }}>
                Renewal Amount:{" "}
                {computedAmount != null ? computedAmount : "-"}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Quotation
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
