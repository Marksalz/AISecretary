
import { useState, useRef, useEffect } from "react";
import "../styles/InputChat.css";

export default function InputChat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: string; text: string; isHtml?: boolean }[]
  >([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever chatHistory updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Send message to server
  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to history
    setChatHistory([...chatHistory, { sender: "user", text: message }]);
    const msgToSend = message;
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgToSend }),
      });

      const data = await res.json();
      let botReply = data.response;

      // Detect if bot returned JSON (list of events)
      let isHtml = false;
      if (Array.isArray(data.events)) {
        // Build HTML list of events
        botReply = `<ul>${data.events
          .map(
            (e: any) =>
              `<li><strong>${e.summary}</strong> - ${new Date(
                e.start.dateTime || e.start.date
              ).toLocaleString()}</li>`
          )
          .join("")}</ul>`;
        isHtml = true;
      }

      // Add bot response to history
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: botReply, isHtml },
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
      <h2>Agenda Chat</h2>

      {/* Chat history */}
      <div className="chat-history">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <strong>{msg.sender}:</strong>{" "}
            {msg.isHtml ? (
              <span dangerouslySetInnerHTML={{ __html: msg.text }} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
