export default function Welcome() {
   

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Welcome to AI Secretary!</h1>

      <button
        onClick={() => window.location.href = "http://localhost:3000/auth/google"}
        style={{ padding: "10px 20px", fontSize: "16px", margin: "20px" }}
      >
        Login with Google
      </button>

      <br />

      <img
        src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
        alt="Google Logo"
        width={120}
      />
    </div>
  );
}