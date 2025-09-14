import { useState } from "react";
import "../styles/InputChat.css";
export default function InputChat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: string; text: string }[]
  >([]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setChatHistory([...chatHistory, { sender: "user", text: message }]);
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: data.response },
      ]);
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
    <div className="chat-container">
      <h2>Chat</h2>

      <div className="chat-history">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
