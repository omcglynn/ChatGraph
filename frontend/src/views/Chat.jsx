import React, { useState, useEffect, useRef } from "react";

export default function Chat({ selectedChat, onClose /* optional */, supabase }) {
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

  // fetch persisted messages from backend for the selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat?.id || !supabase) return;
      try {
        const api = await import('../api');
        // prefer REST param: GET /api/messages/:chatId
        let res = await api.fetchWithAuth(supabase, `/api/messages/${selectedChat.id}`);
        if (!res.ok) {
          res = await api.fetchWithAuth(supabase, `/api/messages?chatId=${selectedChat.id}`);
        }
        if (!res.ok) {
          console.warn('Failed to load messages', res.status);
          return;
        }
        const msgs = await res.json();
        // map backend messages (author/content) to chat message format
        const mapped = (Array.isArray(msgs) ? msgs : []).map((m) => ({
          id: m.id,
          role: m.author === 'user' ? 'user' : 'assistant',
          text: m.content,
        }));

        // drop any previous persisted messages (keep initialMessages at start)
        const base = initialMessages || [];
        setMessages([...base, ...mapped]);
      } catch (err) {
        console.error('Error loading messages for chat', err);
      }
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id, supabase]);

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
        // Persist the user's message to the backend if possible
        try {
          if (supabase && selectedChat?.id) {
            const res = await (await import('../api')).fetchWithAuth(supabase, '/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: selectedChat.id, content: text }),
            });
            if (res.ok) {
              const payload = await res.json();
              // backend returns { success, userMessage, aiMessage }
              const saved = payload?.userMessage || payload?.user_message || null;
              const aiText = payload?.aiMessage || payload?.ai_message || payload?.aiMessage;
              if (saved?.id) {
                setMessages((m) => m.map((msg) => (msg.id === userMsg.id ? { ...msg, id: saved.id } : msg)));
              }

              // Replace thinking message with AI reply if provided, otherwise fall back to echo
              const replyText = aiText || `Echo: ${text}`;
              setMessages((m) => m.map((msg) => (msg.id === thinkingId ? { ...msg, text: replyText } : msg)));
              return;
            } else {
              console.warn('Failed to persist message', res.status);
            }
          }
        } catch (persistErr) {
          console.warn('Error persisting message:', persistErr);
        }

        // Fallback local echo if backend not available
        await new Promise((r) => setTimeout(r, 900));
        const botText = `Echo: ${text}`;
        setMessages((m) => m.map((msg) => (msg.id === thinkingId ? { ...msg, text: botText } : msg)));
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