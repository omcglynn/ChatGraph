import React, { useState, useEffect, useRef } from "react";

export default function Chat({ selectedChat, onClose /* optional */ }) {
  const initialMessages = [
    {
      id: "sys-1",
      role: "system",
      text: `Chat: ${selectedChat?.title || "New Chat"}`,
    },
    ...(selectedChat?.summary
      ? selectedChat.summary.map((s, i) => ({
          id: `ctx-${i}`,
          role: "assistant",
          text: typeof s === "string" ? s : s.text || JSON.stringify(s),
        }))
      : []),
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
    setInput("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    setError(null);

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const thinkingId = `t-${Date.now()}`;
    const thinkingMsg = { id: thinkingId, role: "assistant", text: "Thinking..." };
    setMessages((m) => [...m, thinkingMsg]);

    try {
      // Replace this with a real backend fetch later
      await new Promise((r) => setTimeout(r, 900));
      const botText = `Echo: ${text}`;

      setMessages((m) =>
        m.map((msg) => (msg.id === thinkingId ? { ...msg, text: botText } : msg))
      );
    } catch {
      setError("Failed to send message.");
      setMessages((m) => m.filter((msg) => msg.id !== thinkingId));
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "assistant", text: "Error: failed to get response." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => {
              if (typeof onClose === "function") onClose();
            }}
            className="cg-button secondary"
            title="Back to Graph"
          >
            ← Graph
          </button>

          <div style={{ fontWeight: 700, color: "var(--cg-text)" }}>
            {selectedChat?.title || "Chat"}
          </div>
        </div>

        <div style={{ fontSize: "0.9rem", color: "var(--cg-muted)" }}>
          {selectedChat?.date || ""}
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${m.role === "user" ? "user" : "bot"}`}
          >
            <div className={`chat-bubble ${m.role === "user" ? "user" : "bot"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="cg-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message and press Enter..."
          rows={1}
          style={{ minHeight: 40 }}
        />
        <button
          className="cg-button"
          onClick={sendMessage}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      {error && (
        <div style={{ padding: 8, color: "#b91c1c", fontSize: "0.9rem" }}>{error}</div>
      )}
    </div>
  );
}