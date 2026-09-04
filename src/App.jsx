import React, { useState, useEffect } from "react";
import CreateQuotation from "./pages/CreateQuotation";
import CreatedQuotation from "./pages/CreatedQuotation";
import DashboardPage from "./pages/DashboardPage";
import QuotationPdfView from "./pages/QuotationPdfView";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/Settings/Masters/UsersPage";
import ModulesPage from "./pages/Settings/Masters/ModulesPage";
import EditQuotation from "./pages/EditQuotation";
import QuotationHistory from "./pages/QuotationHistory";
import AllQuotationRevisions from "./pages/AllQuotationRevisions";
import PurchaseOrder from "./pages/PurchaseOrder/PurchaseOrder";
import PurchaseOrderPrint from "./pages/PurchaseOrder/PurchaseOrderPrint";
import PurchaseOrderEntryForm from "./pages/PurchaseOrder/PurchaseOrderEntryForm";
import CreatedPurchaseOrders from "./pages/PurchaseOrder/CreatedPurchaseOrders";
import CreatedInvoices from "./pages/Inovice/CreatedInvoices";
import InvoiceEntryForm from "./pages/Inovice/InvoiceEntryForm";
import GSTInvoice from "./pages/Inovice/GSTInvoice";
import GSTInvoicePrint from "./pages/Inovice/GSTInvoicePrint";
import { useAuth } from "./context/AuthContext";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// Use local icons from public/logo instead of @mui/icons-material in topbar buttons
import "./App.css";

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [settingsInitialTab, setSettingsInitialTab] = useState("users");
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [editQuotationId, setEditQuotationId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getPurchaseOrderInitialData = () => {
    try {
      const stored = sessionStorage.getItem("purchaseOrderData");
      return stored ? JSON.parse(stored) : undefined;
    } catch (error) {
      console.error(
        "Failed to read purchase order data from session storage",
        error,
      );
      return undefined;
    }
  };

  const getInvoiceInitialData = () => {
    try {
      const stored = sessionStorage.getItem("invoiceData");
      return stored ? JSON.parse(stored) : undefined;
    } catch (error) {
      console.error("Failed to read invoice data from session storage", error);
      return undefined;
    }
  };

  useEffect(() => {
    if (user) {
      setView("dashboard");
    }
  }, [user]);

  const navigate = (newView, initialTab, quotationId) => {
    if (initialTab) setSettingsInitialTab(initialTab);
    if (quotationId) setEditQuotationId(quotationId);
    setView(newView);
  };

  const pageTitle =
    {
      dashboard: "Dashboard",
      create: "Create quotation",
      "created-quotations": "Quotations",
      "edit-quotation": "Edit quotation",
      "quotation-history": "Quotation revision history",
      "all-revisions": "All Quotation Revisions",
      "purchase-order": "Purchase Order",
      "purchase-order-print": "Purchase Order Print Preview",
      "purchase-order-entry": "Purchase Order Entry",
      "created-purchase-orders": "Purchase Orders",
      "created-invoices": "GST Invoices",
      users: "Users",
      modules: "Modules",
      settings: "Settings",
      "quotation-detail": "Quotation details",
      quotation: "Quotation preview",
      // "invoice-entry": "GST Invoice Entry",
      invoice: "GST Invoice",
      "invoice-print": "GST Invoice Print Preview",
    }[view] || "";

  const menuItems = [
    { label: "Dashboard", icon: "dashboard.png", view: "dashboard" },
    { label: "Create quotation", icon: "add-button.png", view: "create" },
    { label: "Quotations", icon: "clipboard.png", view: "created-quotations" },
    {
      label: "Purchase Orders",
      icon: "clipboard.png",
      view: "created-purchase-orders",
    },
    { label: "Revision History", icon: "audit.png", view: "all-revisions" },
    { label: "GST Invoice", icon: "calculator.png", view: "created-invoices" },
    { label: "Settings", icon: "settings.png", view: "settings" },
  ];
  const masterItems = [
    ["users", "Users"],
    ["modules", "Modules"],
    ["customers", "Customers"],
    ["suppliers", "Suppliers"],
    ["company-profile", "Company Profile"],
    ["bank-accounts", "Bank Accounts"],
    ["gst-rates", "GST Rates"],
    ["terms-templates", "Terms Templates"],
  ];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__brand">
          <img
            src="/logo/logo.png"
            alt="BlechTek Software Solutions LLP"
            className="app-topbar__logo"
          />
          {user && (
            <span className="app-topbar__page-title">Quotation Management</span>
          )}
        </div>
        <div className="app-topbar__actions">
          {user && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginRight: 8,
                }}
              >
                <div style={{ textAlign: "right", lineHeight: 1 }}>
                  <div style={{ color: "#1e293b" }}>
                    {user?.name ||
                      user?.firstName ||
                      (user?.email ? user.email.split("@")[0] : "")}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {user?.role || ""}
                  </div>
                </div>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 20,
                    border: "2px solid #0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {(user?.name || user?.firstName || user?.email || "")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              </div>

              {/* <Tooltip title="Dashboard">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => navigate("dashboard")}
                >
                  <img
                    src="/logo/dashboard.png"
                    alt="Dashboard"
                    style={{ width: 24, height: 24 }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => navigate("settings")}
                >
                  <img
                    src="/logo/settings.png"
                    alt="Settings"
                    style={{ width: 24, height: 24 }}
                  />
                </IconButton>
              </Tooltip> */}
              <Tooltip title="Logout">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => {
                    logout();
                    navigate("login");
                  }}
                >
                  <img
                    src="/logo/logout.png"
                    alt="Logout"
                    style={{ width: 24, height: 24 }}
                  />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </header>

      {!user ? (
        <main className="app-main">
          <LoginPage />
        </main>
      ) : (
        <div
          className={`app-body ${sidebarCollapsed ? "app-body--collapsed" : ""}`}
        >
          <aside className="app-sidebar" aria-label="Primary navigation">
            <div className="app-sidebar__header">
              <IconButton
                className="app-sidebar__toggle"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <img src="/logo/sidebar.png" alt="" aria-hidden="true" />
              </IconButton>
            </div>
            {/* <div className="app-sidebar__heading">Workspace</div> */}
            <nav className="app-sidebar__nav">
              {menuItems.map((item) => {
                const activeView =
                  item.view === "created-quotations"
                    ? [
                        "created-quotations",
                        "quotation-detail",
                        "edit-quotation",
                        "quotation",
                        "quotation-history",
                      ].includes(view)
                    : item.view === "all-revisions"
                      ? view === "all-revisions"
                      : item.view === "settings"
                        ? ["settings", "users", "modules", "customers", "suppliers", "company-profile", "bank-accounts", "gst-rates", "terms-templates"].includes(view)
                        : item.view === "created-invoices"
                          ? [
                              "created-invoices",
                              "invoice-entry",
                              "invoice",
                            ].includes(view)
                          : view === item.view;
                return (
                  <React.Fragment key={item.view}>
                    <button
                      type="button"
                      className={`app-sidebar__item ${activeView ? "app-sidebar__item--active" : ""}`}
                      onClick={() => {
                        if (item.view === "settings") {
                          setSettingsExpanded((expanded) => !expanded);
                          navigate("settings", settingsInitialTab);
                        } else {
                          navigate(item.view);
                        }
                      }}
                    >
                      <span className="app-sidebar__icon">
                        <img
                          src={`/logo/${item.icon}`}
                          alt=""
                          aria-hidden="true"
                        />
                      </span>
                      <span className="app-sidebar__label">{item.label}</span>
                      {item.view === "settings" && (
                        <KeyboardArrowDownIcon
                          className={`app-sidebar__settings-arrow ${settingsExpanded ? "app-sidebar__settings-arrow--open" : ""}`}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    {item.view === "settings" && settingsExpanded && !sidebarCollapsed && (
                      <div className="app-sidebar__submenu">
                        {masterItems.map(([tab, label]) => (
                          <button
                            type="button"
                            key={tab}
                            className={`app-sidebar__submenu-item ${settingsInitialTab === tab ? "app-sidebar__submenu-item--active" : ""}`}
                            onClick={() => navigate("settings", tab)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </aside>
          <main className="app-main">
            {![
              "create",
              "created-quotations",
              "users",
              "modules",
              "settings",
              "edit-quotation",
              "quotation",
              "quotation-detail",
              "quotation-history",
              "all-revisions",
              "purchase-order",
              "purchase-order-print",
              "purchase-order-entry",
              "created-purchase-orders",
              "created-invoices",
              "invoice",
              "invoice-print",
            ].includes(view) && (
              <div className="app-section-title">
                <h1>{pageTitle}</h1>
                <span aria-hidden="true" />
              </div>
            )}
            {(() => {
              switch (view) {
                case "dashboard":
                  return <DashboardPage onNavigate={navigate} />;
                case "settings":
                  return (
                    <SettingsPage
                      onNavigate={navigate}
                      initialTab={settingsInitialTab}
                    />
                  );
                case "quotation-detail":
                  return <CreateQuotation onNavigate={navigate} readOnly />;
                case "users":
                  return <UsersPage onNavigate={navigate} initialTab="users" />;
                case "modules":
                  return (
                    <ModulesPage onNavigate={navigate} initialTab="modules" />
                  );
                case "all-revisions":
                  return <AllQuotationRevisions onNavigate={navigate} />;
                case "created-quotations":
                  return <CreatedQuotation onNavigate={navigate} />;
                case "edit-quotation":
                  return (
                    <EditQuotation
                      onNavigate={navigate}
                      quotationId={editQuotationId}
                    />
                  );
                case "quotation-history":
                  return (
                    <QuotationHistory
                      onNavigate={navigate}
                      quotationId={editQuotationId}
                    />
                  );
                case "quotation":
                  return (
                    <QuotationPdfView
                      onBack={() => navigate("settings", "created-quotations")}
                    />
                  );
                case "purchase-order-entry":
                  return (
                    <PurchaseOrderEntryForm
                      onNavigate={navigate}
                      purchaseOrderId={sessionStorage.getItem("purchaseOrderId")}
                      defaultReturnView={
                        sessionStorage.getItem("purchaseOrderBackView") ||
                        "created-purchase-orders"
                      }
                    />
                  );
                case "created-purchase-orders":
                  return <CreatedPurchaseOrders onNavigate={navigate} />;
                case "purchase-order":
                  return (
                    <PurchaseOrder
                      initialData={getPurchaseOrderInitialData()}
                      onNavigate={navigate}
                      onConvertToInvoice={() => {
                        sessionStorage.setItem(
                        "invoiceBackView",
                        "purchase-order",
                        );
                        navigate("invoice-entry");
                      }}
                      onBackToQuotation={() =>
                        navigate(
                        sessionStorage.getItem("purchaseOrderBackView") ||
                            "created-purchase-orders",
                        )
                      }
                    />
                  );
                case "purchase-order-print":
                  return (
                    <PurchaseOrderPrint
                      initialData={getPurchaseOrderInitialData()}
                      onBack={() => navigate("purchase-order")}
                    />
                  );
                case "created-invoices":
                  return <CreatedInvoices onNavigate={navigate} />;
                case "invoice-entry":
                  return (
                    <InvoiceEntryForm
                      onNavigate={navigate}
                      defaultReturnView={
                        sessionStorage.getItem("invoiceBackView") ||
                        "created-invoices"
                      }
                    />
                  );
                case "invoice":
                  return (
                    <GSTInvoice
                      initialData={getInvoiceInitialData()}
                      onNavigate={navigate}
                      onBackToInvoiceList={() => navigate("created-invoices")}
                    />
                  );
                case "invoice-print":
                  return (
                    <GSTInvoicePrint
                      initialData={getInvoiceInitialData()}
                      onBack={() => navigate("invoice")}
                    />
                  );                case "create":
                default:
                  return <CreateQuotation onNavigate={navigate} />;
              }
            })()}
          </main>
        </div>
      )}
    </div>
  );
}
