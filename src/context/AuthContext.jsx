import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("qa_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = async (values) => {
    const resp = await axios.post("/api/auth/login", values);
    const payload = resp.data;
    // payload expected: { token, email }
    localStorage.setItem("qa_token", payload.token);
    localStorage.setItem("qa_user", JSON.stringify({ email: payload.email }));
    setUser({ email: payload.email });
    return payload;
  };

  const logout = () => {
    localStorage.removeItem("qa_token");
    localStorage.removeItem("qa_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
