// import { useAuth } from "../src/Context/AuthContext";
import loginIcon from "../src/assets/avatar.png";
import logoutIcon from "../src/assets/enter.png";   
import logo from "../src/assets/logo.png";
import schedule from "../src/assets/schedule.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../src/Context/AuthContext";
import "../Layout-app/style/Header.css";

export default function Header() {
  const {isLoggedIn,logout,user } = useAuth();
  const navigate = useNavigate();

  return (
    <header>
      <img src={logo} alt="logo-site" className="logo-site" onClick={()=>navigate("/chat")} />
      <img src={schedule} alt="logo-schedule" className="logo-schedule" />

      <section className="section-logo">
        {isLoggedIn ? ( 
          <>
            <span>Hello, {user?.name}</span>
            <img
              src={logoutIcon}
              alt="logout"
              className="logo-logout"
              onClick={logout}
            />
          </>
        ) : (
          <img
            src={loginIcon}
            alt="login"
            className="logo-login"
            onClick={() => navigate("/")}
          />
        )}
      </section>
    </header>
  );
}
