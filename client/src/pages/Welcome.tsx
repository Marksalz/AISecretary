// src/pages/Welcome.tsx
import { useEffect } from "react";
import { useAuth } from "../Context/AuthContext.tsx";

export default function Welcome() {
  const { isLoggedIn, user, login, logout } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5173/me", {
          method: "GET",
          credentials: "include", // important pour HttpOnly cookie
        });

        if (!res.ok) {
          logout();
          return;
        }

        const data = await res.json();
        if (data.user) {
          // On extrait juste le prénom
          const fullName = data.user.name || "";
          const firstName = fullName.split(" ")[0];

          login({
            id: data.user.id,
            name: firstName, // on stocke seulement le prénom
            email: data.user.email,
            picture: data.user.picture,
          });
        } else {
          logout();
        }
      } catch (err) {
        console.error(err);
        logout();
      }
    };

    checkAuth();
  }, [login, logout]);

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      {isLoggedIn && user ? (
        <>
          <h1>Welcome {user.name} </h1>
          <img
            src={user.picture}
            alt={`${user.name}'s profile`}
            width={100}
            style={{ borderRadius: "50%", marginTop: "1rem" }}
          />
        </>
      ) : (
        <>
          <h1>Welcome to AI Secretary!</h1>
          <button
            onClick={() => {
              window.location.href = "http://localhost:3000/auth/google";
            }}
          >
            Login with Google
          </button>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
            alt="Google Logo"
            width={120}
          />
        </>
      )}
    </div>
  );
}
