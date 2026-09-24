import React, { useState, useEffect } from "react";
import CreateQuotation from "./pages/Quotation/CreateQuotation";
import CreatedQuotation from "./pages/Quotation/CreatedQuotation";
import DashboardPage from "./pages/DashboardPage";
import UsersDashboardPage from "./pages/Dashboards/UsersPage";
import RenewalsDashboardPage from "./pages/Dashboards/RenewalsPage";
import QuotationsDashboardPage from "./pages/Dashboards/QuotationsPage";
import PurchaseOrdersDashboardPage from "./pages/Dashboards/PurchaseOrdersPage";
import InvoicesDashboardPage from "./pages/Dashboards/InvoicesPage";
import QuotationPdfView from "./pages/Quotation/QuotationPdfView";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/Settings/Masters/UsersPage";
import ModulesPage from "./pages/Settings/Masters/ModulesPage";

import QuotationHistory from "./pages/Quotation/QuotationHistory";
import AllQuotationRevisions from "./pages/Quotation/AllQuotationRevisions";
import PurchaseOrder from "./pages/PurchaseOrder/PurchaseOrder";
import PurchaseOrderPrint from "./pages/PurchaseOrder/PurchaseOrderPrint";
import PurchaseOrderEntryForm from "./pages/PurchaseOrder/PurchaseOrderEntryForm";
import CreatedPurchaseOrders from "./pages/PurchaseOrder/CreatedPurchaseOrders";
import CreatedInvoices from "./pages/Inovice/CreatedInvoices";
import InvoiceEntryForm from "./pages/Inovice/InvoiceEntryForm";
import GSTInvoice from "./pages/Inovice/GSTInvoice";
import GSTInvoicePrint from "./pages/Inovice/GSTInvoicePrint";
import CustomerSubscriptionsPage from "./pages/Renewal_and_Subscriptions/CustomerSubscriptionsPage";
import RenewalsPage from "./pages/Renewal_and_Subscriptions/RenewalsPage";
import RenewalQuotationPage from "./pages/Renewal_and_Subscriptions/RenewalQuotationPage";
import SubscriptionPricingHistoryPage from "./pages/Renewal_and_Subscriptions/SubscriptionPricingHistoryPage";
import SubscriptionDetailsPage from "./pages/Renewal_and_Subscriptions/SubscriptionDetailsPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import AppHeader from "./components/AppHeader";
import AppSidebar from "./components/AppSidebar";
import { useAuth } from "./context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
// Use local icons from public/logo instead of @mui/icons-material in topbar buttons
import "./App.css";

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [view, setView] = useState(() => {
    try {
      const stored = sessionStorage.getItem("appView");
      if (stored) return stored;
    } catch (error) {
      console.error("Failed to read view from session storage", error);
    }
    return "dashboard";
  });
  const [settingsInitialTab, setSettingsInitialTab] = useState("users");
  const [editQuotationId, setEditQuotationId] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const routeView = location.pathname.replace(/^\/+/, "") || "dashboard";
    setView(routeView);
  }, [location.pathname]);

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

  const getInvoiceInitialData = (preferPrintData = false) => {
    try {
      const stored = sessionStorage.getItem(
        preferPrintData ? "invoicePrintData" : "invoiceData",
      );
      return stored ? JSON.parse(stored) : undefined;
    } catch (error) {
      console.error("Failed to read invoice data from session storage", error);
      return undefined;
    }
  };

  useEffect(() => {
    if (user) {
      try {
        const stored = sessionStorage.getItem("appView");
        if (!stored) {
          routerNavigate("/dashboard", { replace: true });
        } else if (location.pathname === "/" || location.pathname === "") {
          routerNavigate(`/${stored}`, { replace: true });
        }
      } catch (error) {
        console.error("Failed to read view from session storage", error);
        routerNavigate("/dashboard", { replace: true });
      }
    }
  }, [user, location.pathname, routerNavigate]);

  const [subscriptionId, setSubscriptionId] = useState(null);

  const navigate = (
    newView,
    initialTab,
    quotationId,
    selectedSubscriptionId,
  ) => {
    if (initialTab) setSettingsInitialTab(initialTab);
    if (quotationId) setEditQuotationId(quotationId);
    if (selectedSubscriptionId) setSubscriptionId(selectedSubscriptionId);
    setView(newView);
    routerNavigate(`/${newView}`);
    try {
      sessionStorage.setItem("appView", newView);
    } catch (error) {
      console.error("Failed to save view to session storage", error);
    }
  };

  const pageTitle =
    {
      dashboard: "Dashboard",
      "dashboard-users": "Users dashboard",
      "dashboard-renewals": "Renewals & subscriptions dashboard",
      "dashboard-quotations": "Quotations dashboard",
      "dashboard-purchase-orders": "Purchase orders dashboard",
      "dashboard-invoices": "Invoices dashboard",
      create: "Create quotation",
      "created-quotations": "Quotations",
      "edit-quotation": "Edit quotation",
      "quotation-history": "Quotation revision history",
      "all-revisions": "All Quotation Revisions",
      "purchase-order": "Purchase Order",
      "purchase-order-print": "Purchase Order Print Preview",
      "purchase-order-entry": "Purchase Order Entry",
      "created-purchase-orders": "Purchase Orders",
      "created-invoices": "Invoices",
      users: "Users",
      modules: "Modules",
      settings: "Settings",
      "quotation-detail": "Quotation details",
      quotation: "Quotation preview",
      invoice: "Invoice",
      "invoice-print": "Invoice Print Preview",
      "customer-subscriptions": "Customer Subscriptions",
      renewals: "Renewals",
      "renewal-quotations": "Renewal Subscriptions",
      // "pricing-history": "Pricing History",
      "subscription-details": "Subscription Details",
      guidelines: "Guidelines",
    }[view] || "";

  return (
    <div className="app-shell">
      <AppHeader user={user} logout={logout} onNavigate={navigate} />

      {!user ? (
        <main
          className={`app-main ${view === "purchase-order-entry" ? "app-main--po" : view === "invoice-entry" ? "app-main--invoice" : ""}`}
        >
          {view === "forgot-password" ? (
            <ForgotPasswordPage onBackToLogin={() => navigate("login")} />
          ) : (
            <LoginPage onForgotPassword={() => navigate("forgot-password")} />
          )}
        </main>
      ) : (
        <div
          className={`app-body ${sidebarCollapsed ? "app-body--collapsed" : ""}`}
        >
          <AppSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            view={view}
            navigate={navigate}
            settingsInitialTab={settingsInitialTab}
            onSettingsTabChange={setSettingsInitialTab}
          />
          <main
            className={`app-main ${view === "purchase-order-entry" ? "app-main--po" : view === "invoice-entry" ? "app-main--invoice" : ""}`}
          >
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
              "customer-subscriptions",
              "renewals",
              "renewal-quotations",
              "pricing-history",
              "subscription-details",
              "guidelines",
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
                case "dashboard-users":
                  return <UsersDashboardPage />;
                case "dashboard-renewals":
                  return <RenewalsDashboardPage />;
                case "dashboard-quotations":
                  return <QuotationsDashboardPage />;
                case "dashboard-purchase-orders":
                  return <PurchaseOrdersDashboardPage />;
                case "dashboard-invoices":
                  return <InvoicesDashboardPage />;
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
                  return <CreateQuotation onNavigate={navigate} editMode />;
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
                      purchaseOrderId={sessionStorage.getItem(
                        "purchaseOrderId",
                      )}
                      viewOnly={
                        sessionStorage.getItem("purchaseOrderViewOnly") ===
                        "true"
                      }
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
                        sessionStorage.removeItem("invoiceViewOnly");
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
                      initialData={getInvoiceInitialData()}
                      viewOnly={
                        sessionStorage.getItem("invoiceViewOnly") === "true"
                      }
                      editableOnly={
                        sessionStorage.getItem("invoiceEditOnly") === "true"
                      }
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
                      initialData={getInvoiceInitialData(true)}
                      onBack={() => navigate("invoice-entry")}
                    />
                  );
                case "customer-subscriptions":
                  return <CustomerSubscriptionsPage onNavigate={navigate} />;
                case "renewals":
                  return <RenewalsPage onNavigate={navigate} />;
                case "renewal-quotations":
                  return <RenewalQuotationPage onNavigate={navigate} />;
                case "pricing-history":
                  return (
                    <SubscriptionPricingHistoryPage onNavigate={navigate} />
                  );
                case "subscription-details":
                  return (
                    <SubscriptionDetailsPage
                      onNavigate={navigate}
                      subscriptionId={subscriptionId}
                    />
                  );
                case "guidelines":
                  return <GuidelinesPage />;
                case "create":
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
