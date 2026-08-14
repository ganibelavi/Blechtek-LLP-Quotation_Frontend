import React, { useState } from "react";
import CreateQuotation from "./pages/CreateQuotation";
import CreatedQuotation from "./pages/CreatedQuotation";
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
import "./App.css";

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("create");

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar__brand">
          <img
            src="/logo/logo.png"
            alt="BlechTek Software Solutions LLP"
            className="app-topbar__logo"
          />
          {/* <div>
            <h1 className="app-topbar__title">Quotation Studio</h1>
            <p className="app-topbar__subtitle">BlechTek Software Solutions LLP</p>
          </div> */}
        </div>
        <div className="app-topbar__actions">
          {user && (
            <>
              <Tooltip title="Settings">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => setView("settings")}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  className="app-topbar__icon-btn"
                  onClick={() => {
                    logout();
                    setView("login");
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </header>

      <main className="">
        {!user ? (
          <LoginPage />
        ) : (
          (() => {
            switch (view) {
              case "settings":
                return <SettingsPage onNavigate={setView} />;
              case "users":
                return <UsersPage onNavigate={setView} initialTab="users" />;
              case "modules":
                return (
                  <ModulesPage onNavigate={setView} initialTab="modules" />
                );
              case "created-quotations":
                return <CreatedQuotation onNavigate={setView} />;
              case "quotation":
                return <QuotationPdfView onBack={() => setView("create")} />;
              case "create":
              default:
                return <CreateQuotation onNavigate={setView} />;
            }
          })()
        )}
      </main>
    </div>
  );
}
