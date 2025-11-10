import React, { useState } from "react";

/**
 * NewChat landing pane styled to match Chat.jsx
 * Props:
 * - onCreate(chatObject) optional: called when a new chat is created
 */
export default function NewChat({ onCreate, supabase, graphId = null }) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const createChat = async () => {
    const trimmed = (prompt || "").trim();
    if (!trimmed) {
      setMessage("Please enter a prompt to start a chat.");
      return;
    }
    setCreating(true);
    setMessage(null);

    const newChat = {
      id: Date.now(),
      title:
        title?.trim() ||
        (trimmed.length > 40 ? trimmed.slice(0, 37) + "..." : trimmed),
      date: new Date().toLocaleDateString(),
      summary: [{ text: trimmed, children: [] }],
      children: [],
    };

    try {
      // If supabase is available, persist the chat and initial message to backend
      if (supabase) {
        const res = await (await import('../api')).fetchWithAuth(supabase, '/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graphId: graphId || null, title: newChat.title }),
        });
        if (!res.ok) {
          console.error('Failed to create chat on server', res.status);
          setMessage('Failed to create chat on server.');
        } else {
          const payload = await res.json();
          // backend may return { success: true, chat } or { success:true, newChat }
          const created = payload?.chat || payload?.newChat || payload;
          // if user provided an initial prompt, persist it as a message
          if (trimmed) {
            try {
              await (await import('../api')).fetchWithAuth(supabase, '/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: created?.id || newChat.id, content: trimmed }),
              });
            } catch (msgErr) {
              console.warn('Failed to persist initial message:', msgErr);
            }
          }

          // Use the actual chat object from backend (has all database fields)
          const built = {
            ...created,
            created_at: created?.created_at || new Date().toISOString(),
          };
          onCreate && onCreate(built);
          setMessage('Chat created — select it from the sidebar to open the graph.');
        }
      } else {
        onCreate && onCreate(newChat);
        setMessage('Chat created — select it from the sidebar to open the graph.');
      }

      setTitle('');
      setPrompt('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to create chat.');
    } finally {
      setCreating(false);
    }
  };

  const clear = () => {
    setTitle("");
    setPrompt("");
    setMessage(null);
  };

  return (
    <div className="chat-container">
      {/* header matches Chat.jsx */}
      <div className="chat-header">
        <div style={{ fontWeight: 700, color: "var(--cg-text)" }}>Start a new chat</div>
        <div style={{ fontSize: "0.9rem", color: "var(--cg-muted)" }}></div>
      </div>

      {/* main area uses same scrollable area as Chat */}
      <div className="chat-messages" style={{ paddingBottom: 12 }}>
        {/* informational banner (keeps same padding/visual rhythm as messages) */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.02)",
            color: "var(--cg-text)",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 6 }}>Start a new chat</h3>
          <p style={{ margin: 0, color: "var(--cg-muted)" }}>
            Type a prompt below to create a new chat. The chat will be added to the sidebar — select it to open the graph.
          </p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, color: "var(--cg-text)", fontWeight: 600 }}>
            Title (optional)
          </label>
          <input
            className="cg-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short title for this chat (optional)"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, color: "var(--cg-text)", fontWeight: 600 }}>
            First prompt
          </label>
          <textarea
            className="cg-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask something like: 'Give me a plan for a week's worth of healthy dinners...'"
          />
        </div>

        {message && (
          <div style={{ marginTop: 12, color: "var(--cg-text)" }}>{message}</div>
        )}
      </div>

      {/* bottom action area uses same class as Chat's input area for consistent spacing */}
      <div className="chat-input-area" style={{ justifyContent: "flex-start" }}>
        <button
          className="cg-button"
          onClick={createChat}
          disabled={creating}
        >
          {creating ? "Creating..." : "Create Chat"}
        </button>

        <button
          className="cg-button secondary"
          onClick={clear}
          style={{ marginLeft: 8 }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}