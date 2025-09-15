
import { useState, useRef, useEffect } from "react";
import "../styles/InputChat.css";

interface Message {
  sender: 'user' | 'bot';
  text: string;
  isHtml?: boolean;
  eventData?: any; // For calendar events
}

const InputChat = () => {
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Format event details for display
  const formatEventDetails = (event: any): string => {
    if (!event) return 'No event details available';
    
    let details = '';
    if (event.title) details += ` Title: ${event.title}\n`;
    if (event.start) details += ` Start: ${new Date(event.start).toLocaleString()}\n`;
    if (event.end) details += ` End: ${new Date(event.end).toLocaleString()}\n`;
    if (event.location) details += ` Location: ${event.location}\n`;
    if (event.description) details += ` ${event.description}\n`;
    
    return details;
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: Message = { sender: 'user', text: trimmedMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle bot response
      if (data.success) {
        let botMessage: Message;
        
        if (data.data.type === 'calendar_event') {
          // Format calendar event response
          botMessage = {
            sender: 'bot',
            text: `${data.data.message}\n\n${formatEventDetails(data.data.event)}`,
            eventData: data.data.event
          };
        } else {
          // Regular message response
          botMessage = {
            sender: 'bot',
            text: data.data.message
          };
        }
        
        setChatHistory(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Unexpected server response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: `Sorry, an error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } 
  };

  return (
    <div className="chat-container">
      <h2>Assistant AI</h2>
      
      <div className="chat-history">
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender}`}
          >
            <strong>{msg.sender === 'user' ? 'You' : 'Assistant'}:</strong>
            <div className="message-content">
              {msg.isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSend} 
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default InputChat;
