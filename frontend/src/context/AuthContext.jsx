import { createContext, useContext, useState, useCallback } from "react";
import { getUser, getToken, setAuth, clearAuth } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());

  const login = useCallback((newToken, newUser) => {
    setAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (updates) => {
      setUser((prevUser) => {
        const updatedUser = { ...prevUser, ...updates };
        setAuth(token, updatedUser);
        return updatedUser;
      });
    },
    [token],
  );

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
