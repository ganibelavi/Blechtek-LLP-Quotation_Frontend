import React, { useState } from "react";
import CreateQuotation from "./pages/CreateQuotation";
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
          <span className="app-topbar__mark">BT</span>
          <div>
            <h1 className="app-topbar__title">Quotation Studio</h1>
            <p className="app-topbar__subtitle">BlechTek Software Solutions LLP</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="app-topbar__badge">Internal tool</span>
          {user && (
            <>
              <Tooltip title="Settings">
                <IconButton color="inherit" onClick={() => setView("settings")}>
                  <SettingsIcon style={{ color: "#fff" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  color="inherit"
                  onClick={() => {
                    logout();
                    setView("login");
                  }}
                >
                  <LogoutIcon style={{ color: "#fff" }} />
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
              case "settings":
                return <SettingsPage onNavigate={setView} />;
              case "users":
                return <UsersPage />;
              case "modules":
                return <ModulesPage />;
              case "create":
              default:
                return <CreateQuotation />;
            }
          })()
        )}
      </main>
    </div>
  );
}
