import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchPurchaseOrders } from "../../services/quotationApi";
import {
  createSalesOrderFromPo,
  fetchSalesOrderPoPreview,
} from "../../services/salesOrderApi";
import PoComparison from "./PoComparison";
import "./SalesOrder.css";

const getPo = (row) => row.data || row;
const field = (row, camel, pascal) => row?.[camel] ?? row?.[pascal];
const verified = (po) =>
  ["approved", "approvedwithmismatch"].includes(
    String(
      field(po, "verificationStatus", "VerificationStatus") || "",
    ).toLowerCase(),
  );

export default function CreateFromPO({ onNavigate, poId: initialPoId }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPoId, setSelectedPoId] = useState(initialPoId || "");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const verifiedOrders = useMemo(
    () => purchaseOrders.map(getPo).filter(verified),
    [purchaseOrders],
  );

  useEffect(() => {
    let active = true;
    fetchPurchaseOrders()
      .then((rows) => {
        if (active) setPurchaseOrders(Array.isArray(rows) ? rows : []);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.error ||
              "Unable to load purchase orders.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPoId) {
      setPreview(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetchSalesOrderPoPreview(selectedPoId)
      .then((data) => {
        if (active) {
          setPreview(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setPreview(null);
          setError(
            requestError.response?.data?.error ||
              "Unable to preview this purchase order.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPoId]);

  const create = async () => {
    if (!selectedPoId) {
      setError("Select a verified purchase order first.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const order = await createSalesOrderFromPo(selectedPoId);
      onNavigate(`sales-orders/${order.id ?? order.Id}/edit`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to create a sales order from this purchase order.",
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <Box className="sales-order-create-page">
      <header className="po-topbar">
        <div className="po-brand">
          <span className="po-brand-mark">BT</span>
          <div>
            <strong>BLECHTEK</strong>
            <small>Sales operations</small>
          </div>
        </div>
        <div className="po-topbar-context">
          <span className="po-eyebrow">SALES ORDER CONTROL</span>
          <strong>Create Sales Order from PO</strong>
        </div>
        <div className="po-topbar-actions">
          <Button
            className="sales-order-back-button"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => onNavigate("sales-orders")}
            disabled={working}
          >
            {/* Back to Sales Orders */}
          </Button>
        </div>
      </header>

      <Box className="sales-order-create-content">
        <Paper className="sales-order-create-card" variant="outlined">
          <Typography variant="h5" sx={{ mb: 2 }}>
            Select a verified purchase order
          </Typography>
          {loading && purchaseOrders.length === 0 ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography>Loading verified purchase orders...</Typography>
            </Stack>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel id="verified-po-label">
                Verified purchase order
              </InputLabel>
              <Select
                labelId="verified-po-label"
                label="Verified purchase order"
                value={selectedPoId}
                onChange={(event) => setSelectedPoId(event.target.value)}
              >
                {verifiedOrders.map((po) => {
                  const id = field(po, "id", "Id");
                  const number =
                    field(po, "poNo", "PoNo") ||
                    field(po, "clientPoNumber", "ClientPoNumber") ||
                    id;
                  const customer =
                    field(po, "organizationName", "OrganizationName") ||
                    field(po, "companyName", "CompanyName") ||
                    field(po, "buyerName", "BuyerName") ||
                    "";
                  return (
                    <MenuItem key={id} value={id}>
                      {number}
                      {customer ? ` — ${customer}` : ""}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
          {verifiedOrders.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              There are no verified purchase orders available to convert.
            </Alert>
          )}
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}
        {preview && (
          <>
            <Paper className="sales-order-create-card" variant="outlined">
              <Typography variant="h6">
                {preview.purchaseOrderNo ?? preview.PurchaseOrderNo}
              </Typography>
              <Typography color="text.secondary">
                Customer: {preview.customerName ?? preview.CustomerName} · PO
                No: {preview.customerPoNumber ?? preview.CustomerPoNumber}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                Sales Order estimate: ₹
                {Number(
                  preview.grandTotal ?? preview.GrandTotal ?? 0,
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Paper>
            <PoComparison
              rows={preview.comparisonRows ?? preview.ComparisonRows ?? []}
              hasMismatch={preview.hasMismatch ?? preview.HasMismatch}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                className="sales-order-cancel-button"
                onClick={() => onNavigate("sales-orders")}
                disabled={working}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={create}
                disabled={working || loading}
              >
                {working ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Create Sales Order"
                )}
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
