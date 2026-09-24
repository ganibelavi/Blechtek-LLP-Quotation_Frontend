import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";

const menuItems = [
  { label: "Dashboard", icon: "dashboard.png", view: "dashboard" },
  { label: "Quotations", icon: "clipboard.png", view: "created-quotations" },
  {
    label: "Purchase Orders",
    icon: "clipboard.png",
    view: "created-purchase-orders",
  },
  { label: "Invoices", icon: "calculator.png", view: "created-invoices" },
  { label: "Revision History", icon: "audit.png", view: "all-revisions" },
  { label: "Subscriptions", icon: "audit.png", view: "subscriptions" },
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

const createViews = [
  "created-quotations",
  "created-purchase-orders",
  "created-invoices",
];

export default function AppSidebar({
  collapsed,
  onCollapsedChange,
  view,
  navigate,
  settingsInitialTab,
  onSettingsTabChange,
}) {
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [subscriptionsExpanded, setSubscriptionsExpanded] = useState(false);

  const startCreate = (itemView) => {
    if (itemView === "created-quotations") {
      navigate("create");
      return;
    }

    if (itemView === "created-purchase-orders") {
      sessionStorage.removeItem("purchaseOrderId");
      sessionStorage.removeItem("purchaseOrderViewOnly");
      sessionStorage.setItem("purchaseOrderBackView", "created-purchase-orders");
      navigate("purchase-order-entry");
      return;
    }

    sessionStorage.setItem("invoiceBackView", "created-invoices");
    sessionStorage.removeItem("invoiceViewOnly");
    sessionStorage.removeItem("invoiceData");
    navigate("invoice-entry");
  };

  const isActive = (itemView) => {
    if (itemView === "dashboard") {
      return [
        "dashboard",
        "dashboard-users",
        "dashboard-renewals",
        "dashboard-quotations",
        "dashboard-purchase-orders",
        "dashboard-invoices",
      ].includes(view);
    }
    if (itemView === "created-quotations") {
      return [
        "created-quotations",
        "quotation-detail",
        "edit-quotation",
        "quotation",
        "quotation-history",
      ].includes(view);
    }
    if (itemView === "all-revisions") return view === "all-revisions";
    if (itemView === "created-purchase-orders") {
      return [
        "created-purchase-orders",
        "purchase-order",
        "purchase-order-entry",
        "purchase-order-print",
      ].includes(view);
    }
    if (itemView === "created-invoices") {
      return [
        "created-invoices",
        "invoice-entry",
        "invoice",
        "invoice-print",
      ].includes(view);
    }
    if (itemView === "subscriptions") {
      return view === "subscriptions";
    }
    if (itemView === "settings") {
      return view === "settings" && !settingsExpanded;
    }
    return view === itemView;
  };

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <div className="app-sidebar__header">
        <IconButton
          className="app-sidebar__toggle"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <img src="/logo/sidebar.png" alt="" aria-hidden="true" />
        </IconButton>
      </div>
      <nav className="app-sidebar__nav">
        {menuItems.map((item) => {
          const activeView = isActive(item.view);
          return (
            <React.Fragment key={item.view}>
              <div className="app-sidebar__item-row">
                <button
                  type="button"
                  className={`app-sidebar__item ${activeView ? "app-sidebar__item--active" : ""}`}
                  onClick={() => {
                    if (item.view === "settings") {
                      setSettingsExpanded((expanded) => !expanded);
                      setSubscriptionsExpanded(false);
                      navigate("settings", settingsInitialTab);
                    } else if (item.view === "subscriptions") {
                      setSubscriptionsExpanded((expanded) => !expanded);
                      setSettingsExpanded(false);
                      navigate("customer-subscriptions");
                    } else {
                      navigate(item.view);
                    }
                  }}
                >
                  <span className="app-sidebar__icon">
                    <img src={`/logo/${item.icon}`} alt="" aria-hidden="true" />
                  </span>
                  <span className="app-sidebar__label">{item.label}</span>
                  {item.view === "settings" && (
                    <KeyboardArrowDownIcon
                      className={`app-sidebar__settings-arrow ${settingsExpanded ? "app-sidebar__settings-arrow--open" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                  {item.view === "subscriptions" && (
                    <KeyboardArrowDownIcon
                      className={`app-sidebar__settings-arrow ${subscriptionsExpanded ? "app-sidebar__settings-arrow--open" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
                {createViews.includes(item.view) && (
                  <Tooltip title={`Create ${item.label.replace(/s$/, "").toLowerCase()}`}>
                    <IconButton
                      className="app-sidebar__create-action"
                      size="small"
                      aria-label={`Create ${item.label.replace(/s$/, "").toLowerCase()}`}
                      onClick={() => startCreate(item.view)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
              {item.view === "settings" && settingsExpanded && !collapsed && (
                <div className="app-sidebar__submenu">
                  {masterItems.map(([tab, label]) => (
                    <button
                      type="button"
                      key={tab}
                      className={`app-sidebar__submenu-item ${settingsInitialTab === tab ? "app-sidebar__submenu-item--active" : ""}`}
                      onClick={() => {
                        onSettingsTabChange(tab);
                        navigate("settings", tab);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {item.view === "subscriptions" && subscriptionsExpanded && !collapsed && (
                <div className="app-sidebar__submenu">
                  {[
                    ["customer-subscriptions", "Customer subscriptions"],
                    ["renewals", "Renewals"],
                    ["renewal-quotations", "Renewal quotations"],
                  ].map(([subscriptionView, label]) => (
                    <button
                      type="button"
                      key={subscriptionView}
                      className={`app-sidebar__submenu-item ${view === subscriptionView ? "app-sidebar__submenu-item--active" : ""}`}
                      onClick={() => navigate(subscriptionView)}
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
  );
}
