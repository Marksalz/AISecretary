import "../styles/Welcome.css";
import LogoAnimate from "../components/LogoAnimate.jsx"



export default function Welcome() {
  return (
    <div className="welcome-wrapper">
      <div className="welcome-card">

        <h1>Welcome in</h1>
       <LogoAnimate/> 

        <button
          className="welcome-button"
          onClick={() =>
            (window.location.href = "http://localhost:3000/auth/google")
          }
        >
          Login with Google
        </button>

        <img
          className="welcome-logo"
          src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
          alt="Google Logo"
        />
        <div />
      </div>
    </div>  );

}
