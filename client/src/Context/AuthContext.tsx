import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Pour savoir si l’auto-login est terminé

  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    setUser(null);
  };

  // Auto-login au démarrage (ici on peut garder useEffect uniquement dans le provider)
  useEffect(() => {
    fetch("http://localhost:3000/user/me", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const firstName = data.user.name.split(" ")[0];
          login({
            id: data.user.id,
            name: firstName,
            email: data.user.email,
            picture: data.user.picture
          });
        } else {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = {
    isLoggedIn,
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
