import React, { useState, useEffect } from "react";
import CreateQuotation from "./pages/CreateQuotation";
import CreatedQuotation from "./pages/CreatedQuotation";
import DashboardPage from "./pages/DashboardPage";
import QuotationPdfView from "./pages/QuotationPdfView";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import ModulesPage from "./pages/ModulesPage";
import { useAuth } from "./context/AuthContext";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import "./App.css";

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [settingsInitialTab, setSettingsInitialTab] = useState("users");

  useEffect(() => {
    if (user) {
      setView("dashboard");
    }
  }, [user]);

  const navigate = (newView, initialTab) => {
    if (initialTab) setSettingsInitialTab(initialTab);
    setView(newView);
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__brand">
          <img
            src="/logo/logo.png"
            alt="BlechTek Software Solutions LLP"
            className="app-topbar__logo"
          />
        </div>
        <div className="app-topbar__actions">
          {user && (
            <>
              <Tooltip title="Dashboard">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => navigate("dashboard")}
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => navigate("settings")}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => {
                    logout();
                    navigate("login");
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!user ? (
          <LoginPage />
        ) : (
          (() => {
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
                return (
                  <ModulesPage onNavigate={navigate} initialTab="modules" />
                );
              case "created-quotations":
                return <CreatedQuotation onNavigate={navigate} />;
              case "quotation":
                return <QuotationPdfView onBack={() => navigate("settings", "created-quotations")} />;
              case "create":
              default:
                return <CreateQuotation onNavigate={navigate} />;
            }
          })()
        )}
      </main>
    </div>
  );
}
