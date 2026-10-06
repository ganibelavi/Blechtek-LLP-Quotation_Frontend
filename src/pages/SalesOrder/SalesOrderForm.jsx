import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomSnackbar from "../../components/CustomSnackbar";
import {
  fetchSalesOrder,
  fetchSalesOrderMasters,
  submitSalesOrder,
  updateSalesOrder,
} from "../../services/salesOrderApi";
import "./SalesOrder.css";

const read = (source, key) =>
  source?.[key[0].toLowerCase() + key.slice(1)] ?? source?.[key];
const dateInput = (value) => (value ? String(value).slice(0, 10) : "");
const amount = (value) => Number(value || 0);
const errorMessage = (error) =>
  error.response?.data?.error ||
  error.response?.data?.title ||
  "Unable to save the sales order.";

const emptyItem = () => ({
  moduleId: "",
  itemDescription: "",
  hsnSacCode: "",
  quantity: 1,
  uom: "Nos.",
  quotedUnitPrice: "",
  poUnitPrice: "",
  unitPrice: 0,
  discountPercent: 0,
  discountAmount: 0,
  gstRateId: "",
  gstPercent: 0,
});

const initialForm = {
  customerPoNumber: "",
  customerPoDate: "",
  billingAddress: "",
  shippingAddress: "",
  customerGstin: "",
  paymentTermsText: "",
  mismatchRemarks: "",
  billingType: "OneTime",
  bankAccountId: "",
  termsTemplateId: "",
  termsAndConditions: "",
  isSubscription: false,
  subscriptionStart: "",
  subscriptionEnd: "",
  billingCycle: "",
  renewalTermMonths: "",
  autoRenew: false,
  renewalReminderDays: 30,
  items: [],
};

function hydrateOrder(order) {
  return {
    customerPoNumber: read(order, "CustomerPoNumber") || "",
    customerPoDate: dateInput(read(order, "CustomerPoDate")),
    billingAddress: read(order, "BillingAddress") || "",
    shippingAddress: read(order, "ShippingAddress") || "",
    customerGstin: read(order, "CustomerGstin") || "",
    paymentTermsText: read(order, "PaymentTermsText") || "",
    mismatchRemarks: read(order, "MismatchRemarks") || "",
    billingType: read(order, "BillingType") || "OneTime",
    bankAccountId: read(order, "BankAccountId") || "",
    termsTemplateId: read(order, "TermsTemplateId") || "",
    termsAndConditions: read(order, "TermsAndConditions") || "",
    isSubscription: Boolean(read(order, "IsSubscription")),
    subscriptionStart: dateInput(read(order, "SubscriptionStart")),
    subscriptionEnd: dateInput(read(order, "SubscriptionEnd")),
    billingCycle: read(order, "BillingCycle") || "",
    renewalTermMonths: read(order, "RenewalTermMonths") || "",
    autoRenew: Boolean(read(order, "AutoRenew")),
    renewalReminderDays: read(order, "RenewalReminderDays") ?? 30,
    items: (read(order, "Items") || []).map((item) => ({
      moduleId: read(item, "ModuleId") || "",
      itemDescription: read(item, "ItemDescription") || "",
      hsnSacCode: read(item, "HsnSacCode") || "",
      quantity: read(item, "Quantity") ?? 1,
      uom: read(item, "Uom") || "",
      quotedUnitPrice: read(item, "QuotedUnitPrice") ?? "",
      poUnitPrice: read(item, "PoUnitPrice") ?? "",
      unitPrice: read(item, "UnitPrice") ?? 0,
      discountPercent: read(item, "DiscountPercent") ?? 0,
      discountAmount: read(item, "DiscountAmount") ?? 0,
      gstRateId: read(item, "GstRateId") || "",
      gstPercent: read(item, "GstPercent") ?? 0,
    })),
  };
}

export default function SalesOrderForm({ salesOrderId, onNavigate }) {
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [masters, setMasters] = useState({
    modules: [],
    gstRates: [],
    bankAccounts: [],
    termsTemplates: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    const warnBeforeLeave = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSalesOrder(salesOrderId), fetchSalesOrderMasters()])
      .then(([salesOrder, masterData]) => {
        if (!active) return;
        setOrder(salesOrder);
        setForm(hydrateOrder(salesOrder));
        setMasters(masterData);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [salesOrderId]);

  const status = read(order, "Status") || "";
  const editable = ["Draft", "PendingVerification"].includes(status);
  const updateField = (name, value) => {
    setDirty(true);
    setForm((current) => ({ ...current, [name]: value }));
  };
  const updateItem = (index, name, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }));
  };
  const updateModule = (index, value) => {
    const selected = masters.modules.find(
      (module) => String(read(module, "Id")) === String(value),
    );
    setDirty(true);
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              moduleId: value,
              itemDescription:
                read(selected, "ModuleName") || item.itemDescription,
              hsnSacCode:
                read(selected, "HsnCode") ||
                read(selected, "SacCode") ||
                item.hsnSacCode,
              unitPrice: item.unitPrice || read(selected, "Price") || 0,
            }
          : item,
      ),
    }));
  };
  const updateGstRate = (index, value) => {
    const selected = masters.gstRates.find(
      (rate) => String(read(rate, "Id")) === String(value),
    );
    const interstate = Boolean(read(order, "IsInterState"));
    const percent = selected
      ? interstate
        ? amount(read(selected, "IgstPct"))
        : amount(read(selected, "CgstPct")) + amount(read(selected, "SgstPct"))
      : 0;
    updateItem(index, "gstRateId", value);
    updateItem(index, "gstPercent", percent);
  };

  const totals = useMemo(() => {
    const result = form.items.reduce(
      (acc, item) => {
        const gross = amount(item.quantity) * amount(item.unitPrice);
        const discount =
          amount(item.discountPercent) > 0
            ? (gross * amount(item.discountPercent)) / 100
            : amount(item.discountAmount);
        const taxable = Math.max(gross - discount, 0);
        const tax = (taxable * amount(item.gstPercent)) / 100;
        acc.subtotal += gross;
        acc.discount += discount;
        acc.taxable += taxable;
        acc.tax += tax;
        return acc;
      },
      { subtotal: 0, discount: 0, taxable: 0, tax: 0 },
    );
    const interState = Boolean(read(order, "IsInterState"));
    const cgst = interState ? 0 : result.tax / 2;
    const sgst = interState ? 0 : result.tax - cgst;
    const igst = interState ? result.tax : 0;
    const beforeRounding = result.taxable + cgst + sgst + igst;
    const grandTotal = Math.round(beforeRounding);
    return {
      ...result,
      cgst,
      sgst,
      igst,
      roundOff: grandTotal - beforeRounding,
      grandTotal,
    };
  }, [form.items, order]);

  const payload = () => ({
    customerPoNumber: form.customerPoNumber,
    customerPoDate: form.customerPoDate || null,
    billingAddress: form.billingAddress,
    shippingAddress: form.shippingAddress,
    customerGstin: form.customerGstin,
    paymentTermsText: form.paymentTermsText,
    mismatchRemarks: form.mismatchRemarks,
    billingType: form.billingType,
    bankAccountId: form.bankAccountId ? Number(form.bankAccountId) : null,
    termsTemplateId: form.termsTemplateId ? Number(form.termsTemplateId) : null,
    termsAndConditions: form.termsAndConditions,
    isSubscription: form.isSubscription,
    subscriptionStart: form.subscriptionStart || null,
    subscriptionEnd: form.subscriptionEnd || null,
    billingCycle: form.billingCycle || null,
    renewalTermMonths: form.renewalTermMonths
      ? Number(form.renewalTermMonths)
      : null,
    autoRenew: form.autoRenew,
    renewalReminderDays: form.renewalReminderDays
      ? Number(form.renewalReminderDays)
      : null,
    items: form.items.map((item) => ({
      moduleId: item.moduleId ? Number(item.moduleId) : null,
      itemDescription: item.itemDescription.trim(),
      hsnSacCode: item.hsnSacCode || null,
      quantity: Number(item.quantity),
      uom: item.uom || null,
      quotedUnitPrice:
        item.quotedUnitPrice === "" ? null : Number(item.quotedUnitPrice),
      poUnitPrice: item.poUnitPrice === "" ? null : Number(item.poUnitPrice),
      unitPrice: Number(item.unitPrice),
      discountPercent: Number(item.discountPercent || 0),
      discountAmount: Number(item.discountAmount || 0),
      gstRateId: item.gstRateId ? Number(item.gstRateId) : null,
      gstPercent: Number(item.gstPercent || 0),
    })),
  });

  const save = async (submit = false) => {
    if (
      !form.items.length ||
      form.items.some(
        (item) => !item.itemDescription.trim() || amount(item.quantity) <= 0,
      )
    ) {
      setError(
        "Add at least one item and provide a description and positive quantity for every line.",
      );
      return;
    }
    if (
      form.isSubscription &&
      (!form.subscriptionStart ||
        !form.renewalTermMonths ||
        amount(form.renewalTermMonths) <= 0)
    ) {
      setError(
        "Subscription orders need a start date and a positive renewal term.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateSalesOrder(salesOrderId, payload());
      if (submit) {
        await submitSalesOrder(salesOrderId);
      }
      const refreshed = await fetchSalesOrder(salesOrderId);
      setOrder(refreshed);
      setForm(hydrateOrder(refreshed));
      setDirty(false);
      setNotice({
        open: true,
        severity: "success",
        message: submit
          ? "Sales order submitted for verification."
          : "Sales order saved.",
      });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (!order)
    return (
      <Alert severity="error">
        {error || "Sales order could not be loaded."}
      </Alert>
    );

  return (
    <Box className="sales-order-form-page" sx={{ display: "grid", gap: 2 }}>
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
          <strong>Sales order workspace</strong>
        </div>
        <div className="po-topbar-actions">
          <span className="po-status-pill">{status}</span>
          <Button
            className="sales-order-back-button"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => onNavigate("sales-orders")}
            disabled={saving}
            aria-label="Back to Sales Orders"
          >
            {/* Back */}
          </Button>
        </div>
      </header>
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <section className="po-detail-panel">
        <div className="po-detail-header">
          <div>
            <span className="po-eyebrow">SELECTED RECORD</span>
            <h1>{read(order, "SoNumber")}</h1>
            <p>
              {read(order, "CustomerName")} · PO{" "}
              {read(order, "PurchaseOrderNo")}
            </p>
          </div>
          <div className="po-detail-actions">
            <TextField
              className="sales-order-labeled-field"
              label="Sales order date"
              type="date"
              size="small"
              value={dateInput(read(order, "SoDate"))}
              InputLabelProps={{ shrink: true }}
              disabled
            />
          </div>
        </div>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {!editable && (
            <Alert severity="info">
              This sales order is read-only in its current status.
            </Alert>
          )}
          {Boolean(read(order, "HasMismatch")) && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Quotation differences were identified. Mismatch remarks are
              required before confirmation.
            </Alert>
          )}
          <Box
            className="sales-order-fields-grid"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.5,
              mt: 2,
            }}
          >
            <TextField
              label="Customer PO number"
              size="small"
              value={form.customerPoNumber}
              onChange={(e) => updateField("customerPoNumber", e.target.value)}
              disabled={!editable}
            />
            <TextField
              label="Customer PO date"
              type="date"
              size="small"
              value={form.customerPoDate}
              onChange={(e) => updateField("customerPoDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!editable}
            />
            <TextField
              label="Billing address"
              multiline
              minRows={2}
              value={form.billingAddress}
              onChange={(e) => updateField("billingAddress", e.target.value)}
              disabled={!editable}
            />
            <TextField
              label="Shipping address"
              multiline
              minRows={2}
              value={form.shippingAddress}
              onChange={(e) => updateField("shippingAddress", e.target.value)}
              disabled={!editable}
            />
            <TextField
              label="Customer GSTIN"
              value={form.customerGstin}
              onChange={(e) => updateField("customerGstin", e.target.value)}
              disabled={!editable}
            />
            <TextField
              label="Payment terms"
              value={form.paymentTermsText}
              onChange={(e) => updateField("paymentTermsText", e.target.value)}
              disabled={!editable}
            />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6">Items</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => updateField("items", [...form.items, emptyItem()])}
              disabled={!editable}
            >
              Add line
            </Button>
          </Stack>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1050 }}>
              <TableHead>
                <TableRow>
                  {[
                    "Module",
                    "Description",
                    "HSN/SAC",
                    "Qty",
                    "Unit price",
                    "Discount %",
                    "GST",
                    "Line total",
                    "",
                  ].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, index) => {
                  const gross = amount(item.quantity) * amount(item.unitPrice);
                  const discount =
                    amount(item.discountPercent) > 0
                      ? (gross * amount(item.discountPercent)) / 100
                      : amount(item.discountAmount);
                  const taxable = Math.max(gross - discount, 0);
                  const lineTotal =
                    taxable * (1 + amount(item.gstPercent) / 100);
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ minWidth: 170 }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id={`module-${index}`}>Module</InputLabel>
                          <Select
                            labelId={`module-${index}`}
                            label="Module"
                            value={item.moduleId}
                            onChange={(e) =>
                              updateModule(index, e.target.value)
                            }
                            disabled={!editable}
                          >
                            <MenuItem value="">Custom item</MenuItem>
                            {masters.modules.map((module) => (
                              <MenuItem
                                key={read(module, "Id")}
                                value={read(module, "Id")}
                              >
                                {read(module, "ModuleName") ||
                                  read(module, "Name")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <TextField
                          size="small"
                          value={item.itemDescription}
                          onChange={(e) =>
                            updateItem(index, "itemDescription", e.target.value)
                          }
                          disabled={!editable}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 110 }}>
                        <TextField
                          size="small"
                          value={item.hsnSacCode}
                          onChange={(e) =>
                            updateItem(index, "hsnSacCode", e.target.value)
                          }
                          disabled={!editable}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 90 }}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0.01, step: 0.01 }}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          disabled={!editable}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", e.target.value)
                          }
                          disabled={!editable}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 105 }}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                          value={item.discountPercent}
                          onChange={(e) =>
                            updateItem(index, "discountPercent", e.target.value)
                          }
                          disabled={!editable}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id={`gst-${index}`}>GST rate</InputLabel>
                          <Select
                            labelId={`gst-${index}`}
                            label="GST rate"
                            value={item.gstRateId}
                            onChange={(e) =>
                              updateGstRate(index, e.target.value)
                            }
                            disabled={!editable}
                          >
                            <MenuItem value="">No GST</MenuItem>
                            {masters.gstRates.map((rate) => (
                              <MenuItem
                                key={read(rate, "Id")}
                                value={read(rate, "Id")}
                              >
                                {read(rate, "Label") ||
                                  `${read(rate, "IgstPct")}%`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        ₹
                        {lineTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          color="error"
                          aria-label="Remove line"
                          onClick={() =>
                            updateField(
                              "items",
                              form.items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          disabled={!editable}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {form.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No items have been added.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          <Box
            className="sales-order-fields-grid"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: 1,
              mt: 2,
            }}
          >
            {[
              ["Subtotal", totals.subtotal],
              ["Discount", totals.discount],
              ["Taxable", totals.taxable],
              [
                Boolean(read(order, "IsInterState")) ? "IGST" : "CGST",
                totals.cgst,
              ],
              ...(!Boolean(read(order, "IsInterState"))
                ? [["SGST", totals.sgst]]
                : []),
              ["Round off", totals.roundOff],
              ["Grand total", totals.grandTotal],
            ].map(([label, value]) => (
              <Paper key={label} variant="outlined" sx={{ p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography fontWeight={700}>
                  ₹
                  {Number(value).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Commercial terms
          </Typography>
          <Box
            className="sales-order-fields-grid"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <FormControl size="small">
              <InputLabel id="billing-type-label">Billing type</InputLabel>
              <Select
                labelId="billing-type-label"
                label="Billing type"
                value={form.billingType}
                onChange={(e) => updateField("billingType", e.target.value)}
                disabled={!editable}
              >
                {["OneTime", "Advance", "Milestone", "Recurring"].map(
                  (type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="bank-account-label">Bank account</InputLabel>
              <Select
                labelId="bank-account-label"
                label="Bank account"
                value={form.bankAccountId}
                onChange={(e) => updateField("bankAccountId", e.target.value)}
                disabled={!editable}
              >
                <MenuItem value="">No bank account</MenuItem>
                {masters.bankAccounts.map((account) => (
                  <MenuItem
                    key={read(account, "Id")}
                    value={read(account, "Id")}
                  >
                    {read(account, "BankName")} · {read(account, "AccountNo")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="terms-template-label">Terms template</InputLabel>
              <Select
                labelId="terms-template-label"
                label="Terms template"
                value={form.termsTemplateId}
                onChange={(e) => {
                  const template = masters.termsTemplates.find(
                    (row) => String(read(row, "Id")) === String(e.target.value),
                  );
                  updateField("termsTemplateId", e.target.value);
                  if (template)
                    updateField(
                      "termsAndConditions",
                      read(template, "Content") || "",
                    );
                }}
                disabled={!editable}
              >
                <MenuItem value="">No template</MenuItem>
                {masters.termsTemplates.map((template) => (
                  <MenuItem
                    key={read(template, "Id")}
                    value={read(template, "Id")}
                  >
                    {read(template, "Label")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Terms and conditions"
              multiline
              minRows={3}
              value={form.termsAndConditions}
              onChange={(e) =>
                updateField("termsAndConditions", e.target.value)
              }
              disabled={!editable}
            />
            {Boolean(read(order, "HasMismatch")) && (
              <TextField
                label="Mismatch remarks"
                multiline
                minRows={2}
                value={form.mismatchRemarks}
                onChange={(e) => updateField("mismatchRemarks", e.target.value)}
                disabled={!editable}
              />
            )}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <FormControlLabel
            className="sales-order-subscription-toggle"
            control={
              <Checkbox
                checked={form.isSubscription}
                onChange={(e) =>
                  updateField("isSubscription", e.target.checked)
                }
                disabled={!editable}
              />
            }
            label="This is a subscription order"
          />
          {form.isSubscription && (
            <Box
              className="sales-order-fields-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
                mt: 1,
              }}
            >
              <TextField
                label="Start date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.subscriptionStart}
                onChange={(e) =>
                  updateField("subscriptionStart", e.target.value)
                }
                disabled={!editable}
              />
              <TextField
                label="End date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.subscriptionEnd}
                onChange={(e) => updateField("subscriptionEnd", e.target.value)}
                disabled={!editable}
              />
              <FormControl size="small">
                <InputLabel id="billing-cycle-label">Billing cycle</InputLabel>
                <Select
                  labelId="billing-cycle-label"
                  label="Billing cycle"
                  value={form.billingCycle}
                  onChange={(e) => updateField("billingCycle", e.target.value)}
                  disabled={!editable}
                >
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                  <MenuItem value="HalfYearly">Half yearly</MenuItem>
                  <MenuItem value="Yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Renewal term (months)"
                type="number"
                value={form.renewalTermMonths}
                onChange={(e) =>
                  updateField("renewalTermMonths", e.target.value)
                }
                disabled={!editable}
              />
              <TextField
                label="Reminder days"
                type="number"
                value={form.renewalReminderDays}
                onChange={(e) =>
                  updateField("renewalReminderDays", e.target.value)
                }
                disabled={!editable}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.autoRenew}
                    onChange={(e) => updateField("autoRenew", e.target.checked)}
                    disabled={!editable}
                  />
                }
                label="Auto renew"
              />
            </Box>
          )}
        </Paper>

        <Stack
          direction="row"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Box />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => save(false)}
              disabled={!editable || saving}
            >
              {saving ? <CircularProgress size={18} /> : "Save Draft"}
            </Button>
            <Button
              variant="contained"
              onClick={() => save(true)}
              disabled={!editable || saving}
            >
              {saving ? (
                <CircularProgress size={18} />
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </Stack>
        </Stack>
      </section>
      <CustomSnackbar
        open={notice.open}
        severity={notice.severity}
        message={notice.message}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
