import React from "react";

const Welcome: React.FC = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Welcome!</h1>
      <p>You have successfully logged in with Google OAuth.</p>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
        alt="Google Logo"
        width={120}
      />
    </div>
  );
};

export default Welcome;
