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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

const FILTERS = [
  { value: "dueThisMonth", label: "Due This Month" },
  { value: "dueNextMonth", label: "Due Next Month" },
  { value: "expired", label: "Already Expired" },
  { value: "renewed", label: "Renewed" },
];

const toTableRenewal = (row) => ({
  SubscriptionId: row.subscriptionId ?? row.SubscriptionId ?? row.id ?? row.Id,
  RenewalId: row.renewalId ?? row.RenewalId ?? null,
  QuotationId: row.quotationId ?? row.QuotationId ?? null,
  InvoiceId: row.invoiceId ?? row.InvoiceId ?? null,
  CustomerName: row.customerName ?? row.CustomerName ?? "",
  ModuleName: row.moduleName ?? row.ModuleName ?? "",
  SubscriptionEndDate: row.subscriptionEndDate ?? row.SubscriptionEndDate ?? "",
  NextRenewalDate: row.nextRenewalDate ?? row.NextRenewalDate ?? "",
  DaysToRenewal: row.daysToRenewal ?? row.DaysToRenewal ?? null,
  Status: row.status ?? row.Status ?? "",
});

const statusChipColor = (status) => {
  switch (status) {
    case "Renewed":
      return { bgcolor: "#e6f4ea", color: "#1e7e34" };
    case "Expired":
      return { bgcolor: "#fdecea", color: "#c62828" };
    case "Cancelled":
      return { bgcolor: "#f1f1f1", color: "#616161" };
    default:
      return { bgcolor: "#fff4e5", color: "#b26a00" };
  }
};

export default function RenewalsPage({ onNavigate }) {
  const [filter, setFilter] = useState("dueThisMonth");
  const [renewals, setRenewals] = useState([]);
  const [apiError, setApiError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    renewal: null,
  });

  const loadRenewals = (currentFilter) => {
    axios
      .get("/api/renewals", { params: { filter: currentFilter } })
      .then(({ data }) => {
        setRenewals((data || []).map(toTableRenewal));
      })
      .catch(() => {
        setApiError("Could not load renewals from the database.");
      });
  };

  useEffect(() => {
    loadRenewals(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleFilterChange = (_event, newFilter) => {
    if (newFilter !== null) setFilter(newFilter);
  };

  const prepareRenewal = async (renewal) => {
    const { data } = await axios.post(
      `/api/renewals/${renewal.SubscriptionId}/prepare`,
    );
    return data.renewalId ?? data.RenewalId;
  };

  const generateQuotation = async (renewal) => {
    try {
      const renewalId = await prepareRenewal(renewal);
      await axios.post(`/api/renewals/${renewalId}/generate-quotation`);
      setSnackbar({
        open: true,
        message: `Renewal quotation generated for "${renewal.CustomerName}".`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ?? "Could not generate the quotation.",
        severity: "error",
      });
    }
  };

  const generateInvoice = async (renewal) => {
    try {
      const renewalId = renewal.RenewalId || (await prepareRenewal(renewal));
      if (!renewalId) {
        throw new Error("A renewal record is required before invoicing.");
      }
      if (!renewal.QuotationId) {
        throw new Error("Create and link a renewal quotation before invoicing.");
      }
      sessionStorage.setItem(
        "renewalInvoiceContext",
        JSON.stringify({
          renewalId,
          quotationId: renewal.QuotationId,
        }),
      );
      sessionStorage.setItem("invoiceBackView", "renewals");
      onNavigate("invoice-entry");
      setSnackbar({
        open: true,
        message: "Renewal quotation loaded into the invoice form.",
        severity: "info",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ??
          error.message ??
          "Could not prepare the invoice.",
        severity: "error",
      });
    }
  };

  const openConfirm = (action, renewal) => {
    setConfirmDialog({ open: true, action, renewal });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, action: null, renewal: null });
  };

  const handleConfirmAction = async () => {
    const { renewal } = confirmDialog;
    if (!renewal) return;

    const endpoint = `/api/renewals/${renewal.SubscriptionId}/cancel`;

    try {
      await axios.post(endpoint);
      setRenewals((current) =>
        current.filter((r) => r.SubscriptionId !== renewal.SubscriptionId),
      );
      setSnackbar({
        open: true,
        message: `Subscription for "${renewal.CustomerName}" cancelled.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ?? "Could not complete the action.",
        severity: "error",
      });
    } finally {
      closeConfirm();
    }
  };

  const columns = [
    { key: "CustomerName", label: "Customer", sortable: true, minWidth: 180 },
    { key: "ModuleName", label: "Module", sortable: true, minWidth: 180 },
    {
      key: "SubscriptionEndDate",
      label: "Subscription End",
      sortable: true,
      minWidth: 150,
    },
    {
      key: "NextRenewalDate",
      label: "Next Renewal",
      sortable: true,
      minWidth: 140,
    },
    {
      key: "DaysToRenewal",
      label: "Days To Renewal",
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
      minWidth: 180,
      render: ({ row }) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Tooltip title="Generate Renewal Quotation">
            <IconButton size="small" onClick={() => generateQuotation(row)}>
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate Invoice">
            <IconButton size="small" onClick={() => generateInvoice(row)}>
              <ReceiptLongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Subscription">
            <IconButton size="small" onClick={() => openConfirm("cancel", row)}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          flexWrap: "wrap",
        }}
      >
        <h1 className="page-heading page-heading__text">Renewals</h1>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          {FILTERS.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <EntityTable title="" columns={columns} rows={renewals} />

      {apiError && (
        <Typography color="error" sx={{ mt: 1 }}>
          {apiError}
        </Typography>
      )}

      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirm}
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
            color: "white",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            py: 1.5,
          }}
        >
          Confirm Cancel Subscription
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, fontSize: "14px" }}>
            Are you sure you want to cancel this subscription? This action cannot be undone.{" "}
            <strong>
              {confirmDialog.renewal?.CustomerName} (
              {confirmDialog.renewal?.ModuleName})
            </strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={closeConfirm} sx={dialogSecondaryActionSx}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            sx={dialogPrimaryActionSx}
          >
            Confirm
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
