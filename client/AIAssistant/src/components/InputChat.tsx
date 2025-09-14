import { useState } from "react";

export default function InputChat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: string; text: string }[]
  >([]);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to history
    setChatHistory([...chatHistory, { sender: "user", text: message }]);
    setMessage("");

    try {
      // Send message to server using fetch
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      const botReply = data.response;

      // Add bot response to history
      setChatHistory((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Error: could not get response" },
      ]);
    }
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "1rem" }}>
      <h2>Chat</h2>

      {/* Chat history */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          minHeight: "200px",
          marginBottom: "1rem",
        }}
      >
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            style={{ textAlign: msg.sender === "user" ? "right" : "left" }}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Input + send button */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button onClick={handleSend} style={{ padding: "0.5rem 1rem" }}>
          Send
        </button>
      </div>
    </div>
  );
}
