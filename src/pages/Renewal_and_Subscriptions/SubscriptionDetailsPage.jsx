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
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

const emptyHistoryEntry = {
  date: "",
  status: "Paid",
  amount: "",
  notes: "",
};

const HISTORY_STATUS_OPTIONS = ["Paid", "Pending", "Overdue", "Refunded"];

const toSummary = (data) => ({
  customerName: data.customerName ?? data.CustomerName ?? "",
  moduleName: data.moduleName ?? data.ModuleName ?? "",
  initialPurchaseAmount:
    data.initialPurchaseAmount ?? data.InitialPurchaseAmount ?? null,
  renewalPercentage: data.renewalPercentage ?? data.RenewalPercentage ?? null,
  escalationPercentage:
    data.escalationPercentage ?? data.EscalationPercentage ?? null,
  status: data.status ?? data.Status ?? "",
  subscriptionStartDate:
    data.subscriptionStartDate ?? data.SubscriptionStartDate ?? "",
  currentSubscriptionYear:
    data.currentSubscriptionYear ?? data.CurrentSubscriptionYear ?? null,
});

const toTableYearPricing = (row) => ({
  Id: row.id ?? row.Id,
  Year: row.year ?? row.Year,
  Price: row.price ?? row.Price ?? null,
  EffectiveDate: row.effectiveDate ?? row.EffectiveDate ?? "",
});

const toTableQuotation = (row) => ({
  Id: row.id ?? row.Id,
  QuotationNumber: row.quotationNumber ?? row.QuotationNumber ?? "",
  Year: row.year ?? row.Year,
  Amount: row.amount ?? row.Amount ?? null,
  Date: row.date ?? row.Date ?? "",
  Status: row.status ?? row.Status ?? "",
});

const toTableInvoice = (row) => ({
  Id: row.id ?? row.Id,
  InvoiceNumber: row.invoiceNumber ?? row.InvoiceNumber ?? "",
  Year: row.year ?? row.Year,
  Amount: row.amount ?? row.Amount ?? null,
  Date: row.date ?? row.Date ?? "",
  Status: row.status ?? row.Status ?? "",
});

const toTableHistory = (row) => ({
  Id: row.id ?? row.Id,
  Date: row.date ?? row.Date ?? "",
  Status: row.status ?? row.Status ?? "",
  Amount: row.amount ?? row.Amount ?? null,
  Notes: row.notes ?? row.Notes ?? "",
});

export default function SubscriptionDetailsPage({ subscriptionId }) {

  const [summary, setSummary] = useState(null);
  const [yearPricing, setYearPricing] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [apiError, setApiError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState(emptyHistoryEntry);

  const loadDetails = () => {
    axios
      .get(`/api/customer-subscriptions/${subscriptionId}/details`)
      .then(({ data }) => {
        setSummary(toSummary(data));
        setYearPricing((data.yearWisePricing || []).map(toTableYearPricing));
        setQuotations((data.renewalQuotations || []).map(toTableQuotation));
        setInvoices((data.renewalInvoices || []).map(toTableInvoice));
        setHistory((data.paymentHistory || []).map(toTableHistory));
      })
      .catch(() => {
        setApiError("Could not load subscription details from the database.");
      });
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId]);

  const openAddHistoryDialog = () => {
    setHistoryForm(emptyHistoryEntry);
    setIsHistoryDialogOpen(true);
  };

  const closeHistoryDialog = () => {
    setIsHistoryDialogOpen(false);
    setHistoryForm(emptyHistoryEntry);
  };

  const updateHistoryField = (event) => {
    const { name, value } = event.target;
    setHistoryForm((current) => ({ ...current, [name]: value }));
  };

  const saveHistoryEntry = async (event) => {
    event.preventDefault();
    if (!historyForm.date || !historyForm.status) return;

    const request = {
      date: historyForm.date,
      status: historyForm.status,
      amount: historyForm.amount === "" ? null : Number(historyForm.amount),
      notes: historyForm.notes || null,
    };

    try {
      const { data } = await axios.post(
        `/api/customer-subscriptions/${subscriptionId}/payment-history`,
        request,
      );
      setHistory((current) => [...current, toTableHistory(data)]);
      setSnackbar({
        open: true,
        message: "Payment/status entry added successfully!",
        severity: "success",
      });
      closeHistoryDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ??
          "Could not save the payment/status entry.",
        severity: "error",
      });
    }
  };

  const yearPricingColumns = [
    { key: "Year", label: "Year", sortable: true, minWidth: 90 },
    { key: "Price", label: "Price", sortable: true, minWidth: 130 },
    {
      key: "EffectiveDate",
      label: "Effective Date",
      sortable: true,
      minWidth: 150,
    },
  ];

  const quotationColumns = [
    {
      key: "QuotationNumber",
      label: "Quotation #",
      sortable: true,
      minWidth: 150,
    },
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

  const invoiceColumns = [
    { key: "InvoiceNumber", label: "Invoice #", sortable: true, minWidth: 150 },
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

  const historyColumns = [
    { key: "Date", label: "Date", sortable: true, minWidth: 140 },
    {
      key: "Status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      render: ({ row }) => <Chip label={row.Status} size="small" />,
    },
    { key: "Amount", label: "Amount", sortable: true, minWidth: 130 },
    { key: "Notes", label: "Notes", minWidth: 220 },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <h1 className="page-heading page-heading__text">
          Subscription Details
        </h1>
        {summary && (
          <Typography variant="body2" color="text.secondary">
            {summary.customerName} &middot; {summary.moduleName}
          </Typography>
        )}
      </Box>

      {apiError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {apiError}
        </Typography>
      )}

      {summary && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Initial Purchase Amount
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.initialPurchaseAmount ?? "-"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Renewal %
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.renewalPercentage != null
                  ? `${summary.renewalPercentage}%`
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Escalation %
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.escalationPercentage != null
                  ? `${summary.escalationPercentage}%`
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Current Status
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.status || "-"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        Year-wise Pricing
      </Typography>
      <EntityTable title="" columns={yearPricingColumns} rows={yearPricing} />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
        Renewal Quotations
      </Typography>
      <EntityTable title="" columns={quotationColumns} rows={quotations} />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
        Renewal Invoices
      </Typography>
      <EntityTable title="" columns={invoiceColumns} rows={invoices} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Payment / Status History
        </Typography>
        <Button variant="contained" size="small" onClick={openAddHistoryDialog}>
          Add Entry
        </Button>
      </Box>
      <EntityTable title="" columns={historyColumns} rows={history} />

      <Dialog
        open={isHistoryDialogOpen}
        onClose={closeHistoryDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ component: "form", onSubmit: saveHistoryEntry }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          Add Payment / Status Entry
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
              label="Date"
              name="date"
              type="date"
              value={historyForm.date}
              onChange={updateHistoryField}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              required
              label="Status"
              name="status"
              value={historyForm.status}
              onChange={updateHistoryField}
            >
              {HISTORY_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount"
              name="amount"
              type="number"
              value={historyForm.amount}
              onChange={updateHistoryField}
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Notes"
              name="notes"
              value={historyForm.notes}
              onChange={updateHistoryField}
              sx={{ gridColumn: { sm: "1 / span 2" } }}
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={closeHistoryDialog}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Add
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
