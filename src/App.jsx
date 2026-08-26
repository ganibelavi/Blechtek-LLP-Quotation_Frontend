import React, { useState, useEffect } from "react";
import CreateQuotation from "./pages/CreateQuotation";
import CreatedQuotation from "./pages/CreatedQuotation";
import DashboardPage from "./pages/DashboardPage";
import QuotationPdfView from "./pages/QuotationPdfView";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import ModulesPage from "./pages/ModulesPage";
import EditQuotation from "./pages/EditQuotation";
import { useAuth } from "./context/AuthContext";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
// Use local icons from public/logo instead of @mui/icons-material in topbar buttons
import "./App.css";

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [settingsInitialTab, setSettingsInitialTab] = useState("users");
  const [editQuotationId, setEditQuotationId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const pageTitle = {
    dashboard: "Dashboard",
    create: "Create quotation",
    "created-quotations": "Quotations",
    "edit-quotation": "Edit quotation",
    users: "Users",
    modules: "Modules",
    settings: "Settings",
    "quotation-detail": "Quotation details",
    quotation: "Quotation preview",
  }[view] || "Dashboard";

  const menuItems = [
    { label: "Dashboard", icon: "dashboard.png", view: "dashboard" },
    { label: "Create quotation", icon: "add-button.png", view: "create" },
    { label: "Quotations", icon: "clipboard.png", view: "created-quotations" },
    { label: "Users", icon: "users.png", view: "users" },
    { label: "Modules", icon: "processes.png", view: "modules" },
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
          {user && <span className="app-topbar__page-title">Quotation Management</span>}
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
                  <div
                    style={{color: "#1e293b" }}
                  >
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
        <div className={`app-body ${sidebarCollapsed ? "app-body--collapsed" : ""}`}>
          <aside className="app-sidebar" aria-label="Primary navigation">
            <div className="app-sidebar__header">
              <IconButton
                className="app-sidebar__toggle"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <img src="/logo/sidebar.png" alt="" aria-hidden="true" />
              </IconButton>
            </div>
            <div className="app-sidebar__heading">Workspace</div>
            <nav className="app-sidebar__nav">
              {menuItems.map((item) => {
                const activeView =
                  item.view === "created-quotations"
                    ? ["created-quotations", "quotation-detail", "edit-quotation", "quotation"].includes(view)
                    : item.view === "settings"
                      ? ["settings", "users", "modules"].includes(view)
                      : view === item.view;
                return (
                  <button
                    type="button"
                    key={item.view}
                    className={`app-sidebar__item ${activeView ? "app-sidebar__item--active" : ""}`}
                    onClick={() => navigate(item.view)}
                  >
                    <span className="app-sidebar__icon">
                      <img src={`/logo/${item.icon}`} alt="" aria-hidden="true" />
                    </span>
                    <span className="app-sidebar__label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
          <main className="app-main">
            {!["create", "created-quotations", "users", "modules", "settings", "edit-quotation", "quotation", "quotation-detail"].includes(view) && (
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
                  return <SettingsPage onNavigate={navigate} initialTab={settingsInitialTab} />;
                case "quotation-detail":
                  return <SettingsPage onNavigate={navigate} initialTab="created-quotations" quotationDetail={true} />;
                case "users":
                  return <UsersPage onNavigate={navigate} initialTab="users" />;
                case "modules":
                  return <ModulesPage onNavigate={navigate} initialTab="modules" />;
                case "created-quotations":
                  return <CreatedQuotation onNavigate={navigate} />;
                case "edit-quotation":
                  return <EditQuotation onNavigate={navigate} quotationId={editQuotationId} />;
                case "quotation":
                  return <QuotationPdfView onBack={() => navigate("settings", "created-quotations")} />;
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
