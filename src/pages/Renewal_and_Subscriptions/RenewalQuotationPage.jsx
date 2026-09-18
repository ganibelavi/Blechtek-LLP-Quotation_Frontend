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
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { fetchInvoiceById } from "../../services/quotationApi";

const emptyForm = {
  customerSubscriptionId: "",
  year: "",
};

const toTableQuotation = (row) => ({
  Id: row.id ?? row.Id,
  RenewalId: row.renewalId ?? row.RenewalId ?? null,
  SubscriptionId: row.subscriptionId ?? row.SubscriptionId ?? null,
  QuotationId: row.quotationId ?? row.QuotationId ?? null,
  InvoiceId: row.invoiceId ?? row.InvoiceId ?? null,
  QuotationNumber: row.quotationNumber ?? row.QuotationNumber ?? "",
  CustomerName: row.customerName ?? row.CustomerName ?? "",
  ModuleName: row.moduleName ?? row.ModuleName ?? "",
  Year: row.year ?? row.Year,
  PeriodStartDate: row.periodStartDate ?? row.PeriodStartDate ?? null,
  PeriodEndDate: row.periodEndDate ?? row.PeriodEndDate ?? null,
  Amount: row.amount ?? row.Amount ?? null,
  Date: row.date ?? row.Date ?? "",
  Status: row.status ?? row.Status ?? "",
});

// Renewal amount = renewal percentage of the base (year 1) price, escalated
// annually from the second renewal year onward.
// This mirrors: basePrice * (renewalPct/100) * (1 + escalationPct/100)^(year-2)
const calculateRenewalAmount = (basePrice, renewalPct, escalationPct, year) => {
  if (!basePrice || !year || year < 2) return null;
  const renewed = basePrice * ((renewalPct || 0) / 100);
  const yearsOfEscalation = year - 2;
  const escalated =
    renewed * Math.pow(1 + (escalationPct || 0) / 100, yearsOfEscalation);
  return Math.round(escalated * 100) / 100;
};

export default function RenewalQuotationPage({ onNavigate }) {
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
    const sub = subscriptions.find((s) => String(s.id ?? s.Id) === String(id));
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

  const saveRenewalInvoice = async (event) => {
    event.preventDefault();
    if (!form.customerSubscriptionId || !form.year) return;
    setApiError("");

    try {
      const { data: prepared } = await axios.post(
        `/api/renewals/${form.customerSubscriptionId}/prepare`,
        null,
        { params: { year: Number(form.year) } },
      );
      sessionStorage.setItem(
        "renewalInvoiceContext",
        JSON.stringify({
          renewalId: prepared.renewalId ?? prepared.RenewalId,
          subscriptionId: prepared.subscriptionId ?? prepared.SubscriptionId,
          customerId:
            prepared.customerId ??
            prepared.CustomerId ??
            selectedSubscription?.customerId ??
            selectedSubscription?.CustomerId ??
            null,
          customerName:
            prepared.customerName ??
            prepared.CustomerName ??
            selectedSubscription?.customerName ??
            selectedSubscription?.CustomerName ??
            "",
          customerAddress:
            prepared.customerAddress ??
            prepared.CustomerAddress ??
            selectedSubscription?.customerAddress ??
            selectedSubscription?.CustomerAddress ??
            "",
          customerContactNumber:
            prepared.customerContactNumber ??
            prepared.CustomerContactNumber ??
            selectedSubscription?.customerContactNumber ??
            selectedSubscription?.CustomerContactNumber ??
            "",
          customerEmail:
            prepared.customerEmail ??
            prepared.CustomerEmail ??
            selectedSubscription?.customerEmail ??
            selectedSubscription?.CustomerEmail ??
            "",
          moduleName:
            prepared.moduleName ??
            prepared.ModuleName ??
            selectedSubscription?.moduleName ??
            selectedSubscription?.ModuleName ??
            "",
          year: prepared.year ?? prepared.Year ?? Number(form.year),
          amount: prepared.amount ?? prepared.Amount ?? computedAmount,
          periodStart:
            prepared.periodStartDate ??
            prepared.PeriodStartDate ??
            subscriptionPeriod?.start ??
            null,
          periodEnd:
            prepared.periodEndDate ??
            prepared.PeriodEndDate ??
            subscriptionPeriod?.end ??
            null,
        }),
      );
      closeDialog();
      sessionStorage.setItem("invoiceBackView", "renewal-quotations");
      sessionStorage.removeItem("invoiceViewOnly");
      sessionStorage.removeItem("invoiceData");
      onNavigate("invoice-entry");
      setSnackbar({
        open: true,
        message: "Renewal details loaded into the invoice form.",
        severity: "info",
      });
    } catch (error) {
      const msg =
        error.response?.data?.error ??
        "Could not prepare the renewal invoice.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const buildRenewalContext = (renewal) => ({
    renewalId: renewal.RenewalId,
    subscriptionId: renewal.SubscriptionId,
    customerId: renewal.CustomerId ?? renewal.customerId ?? null,
    customerName: renewal.CustomerName,
    moduleName: renewal.ModuleName,
    year: renewal.Year,
    amount: renewal.Amount,
    periodStart: null,
    periodEnd: null,
  });

  const createInvoiceForRow = async (renewal) => {
    try {
      const { data: prepared } = await axios.post(
        `/api/renewals/${renewal.SubscriptionId}/prepare`,
        null,
        { params: { year: Number(renewal.Year) } },
      );
      sessionStorage.setItem(
        "renewalInvoiceContext",
        JSON.stringify({
          ...buildRenewalContext(renewal),
          renewalId: prepared.renewalId ?? prepared.RenewalId,
          subscriptionId: prepared.subscriptionId ?? prepared.SubscriptionId,
          customerId:
            prepared.customerId ??
            prepared.CustomerId ??
            renewal.CustomerId ??
            renewal.customerId ??
            null,
          customerName:
            prepared.customerName ??
            prepared.CustomerName ??
            renewal.CustomerName,
          customerAddress:
            prepared.customerAddress ?? prepared.CustomerAddress ?? "",
          customerContactNumber:
            prepared.customerContactNumber ??
            prepared.CustomerContactNumber ??
            "",
          customerEmail: prepared.customerEmail ?? prepared.CustomerEmail ?? "",
          moduleName:
            prepared.moduleName ?? prepared.ModuleName ?? renewal.ModuleName,
          year: prepared.year ?? prepared.Year ?? renewal.Year,
          amount: prepared.amount ?? prepared.Amount ?? renewal.Amount,
          periodStart:
            prepared.periodStartDate ?? prepared.PeriodStartDate ?? null,
          periodEnd: prepared.periodEndDate ?? prepared.PeriodEndDate ?? null,
        }),
      );
      sessionStorage.setItem("invoiceBackView", "renewal-quotations");
      sessionStorage.removeItem("invoiceViewOnly");
      sessionStorage.removeItem("invoiceData");
      onNavigate("invoice-entry");
    } catch (error) {
      const message =
        error.response?.data?.error ??
        "Could not prepare the renewal invoice.";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  const openLinkedInvoice = async (renewal) => {
    try {
      if (renewal.InvoiceId) {
        const invoice = await fetchInvoiceById(renewal.InvoiceId);
        if (!invoice) throw new Error("The linked invoice could not be found.");

        sessionStorage.setItem("invoiceData", JSON.stringify(invoice));
        sessionStorage.setItem("invoiceBackView", "renewal-quotations");
        sessionStorage.setItem("invoiceViewOnly", "true");
      } else {
        sessionStorage.setItem(
          "renewalInvoiceContext",
          JSON.stringify({
            renewalId: renewal.RenewalId,
            subscriptionId: renewal.SubscriptionId,
            customerId: renewal.CustomerId ?? renewal.customerId ?? null,
            customerName: renewal.CustomerName,
            moduleName: renewal.ModuleName,
            year: renewal.Year,
            amount: renewal.Amount,
            periodStart: renewal.PeriodStartDate ?? null,
            periodEnd: renewal.PeriodEndDate ?? null,
          }),
        );
        sessionStorage.setItem("invoiceBackView", "renewal-quotations");
        sessionStorage.removeItem("invoiceViewOnly");
        sessionStorage.removeItem("invoiceData");
      }

      onNavigate("invoice-entry");
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message ?? "Could not open the renewal invoice.",
        severity: "error",
      });
    }
  };

  const columns = [
    {
      key: "QuotationNumber",
      label: "Legacy Quotation #",
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
    {
      key: "actions",
      label: "Actions",
      minWidth: 120,
      render: ({ row }) => (
        <IconButton
          size="small"
          aria-label={
            row.InvoiceId
              ? `Open invoice for ${row.CustomerName}`
              : `Create invoice for ${row.CustomerName}`
          }
          onClick={() =>
            row.InvoiceId
              ? openLinkedInvoice(row)
              : createInvoiceForRow(row)
          }
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
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
        <h1 className="page-heading page-heading__text">Renewal Invoices</h1>
        <Button
          variant="contained"
          // startIcon={
          //   <img
          //     src="/logo/add.png"
          //     alt="Add"
          //     style={{ width: 20, height: 20 }}
          //   />
          // }
          onClick={openAddDialog}
        >
          Create Invoice
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
        PaperProps={{ component: "form", onSubmit: saveRenewalInvoice }}
      >
        <DialogTitle
          sx={{ background: "var(--primary-gradient)", color: "white", p: 1.5 }}
        >
          Create Renewal Invoice
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
                Renewal Amount: {computedAmount != null ? computedAmount : "-"}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Invoice
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
