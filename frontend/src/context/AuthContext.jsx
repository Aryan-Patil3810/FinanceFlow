import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("financeflow_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("financeflow_token");
  });

  const login = (loginResponse) => {
    const authenticatedUser = {
      id: loginResponse.userId,
      email: loginResponse.email,
      firstName: loginResponse.firstName,
    };

    sessionStorage.setItem(
      "financeflow_token",
      loginResponse.token
    );

    sessionStorage.setItem(
      "financeflow_user",
      JSON.stringify(authenticatedUser)
    );

    setToken(loginResponse.token);
    setUser(authenticatedUser);
  };

  const logout = () => {
    sessionStorage.removeItem("financeflow_token");
    sessionStorage.removeItem("financeflow_user");

    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}