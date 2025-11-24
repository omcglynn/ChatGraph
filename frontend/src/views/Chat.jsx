import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import pencilIcon from "../assets/icons/pencil-1.svg";
import plusIcon from "../assets/icons/plus.svg";

export default function Chat({
  selectedChat,
  onClose /* optional */,
  supabase,
  onChatsUpdate,
  setSelectedChat,
  onGraphsRefresh,
  chats = [],
}) {
  // No initial messages - parent summary is handled in the backend
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(selectedChat?.title || "");

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setEditTitleValue(selectedChat?.title || "");
    setIsEditingTitle(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id]);

  // fetch persisted messages from backend for the selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat?.id || !supabase) return;
      try {
        const api = await import('../api');
        // prefer REST param: GET /api/messages/:chatId
        let res = await api.fetchWithAuth(supabase, `/messages/${selectedChat.id}`);
        if (!res.ok) {
          res = await api.fetchWithAuth(supabase, `/messages?chatId=${selectedChat.id}`);
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

        // Set messages directly - no system messages or parent summary shown to user
        setMessages(mapped);
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

  const handleBranchChat = async () => {
    if (!selectedChat?.id || !selectedChat?.graph_id || !supabase) {
      return;
    }

    try {
      const api = await import('../api');
      const branchTitle = `Branch of ${selectedChat.title || 'Chat'}`;
      const res = await api.fetchWithAuth(supabase, '/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: selectedChat.graph_id,
          title: branchTitle,
          parentId: selectedChat.id,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        const newChat = payload?.chat || payload;
        if (newChat) {
          if (onChatsUpdate) {
            onChatsUpdate((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              return [newChat, ...list];
            });
          }
          if (setSelectedChat) {
            setSelectedChat(newChat);
          }
          if (onGraphsRefresh) {
            onGraphsRefresh(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to branch chat:', err);
    }
  };

  const handleNavigateToParent = async () => {
    const parentId = selectedChat?.parent_id;
    if (!parentId) return;

    const parentFromList = Array.isArray(chats) ? chats.find((chat) => chat.id === parentId) : null;
    if (parentFromList) {
      if (setSelectedChat) {
        setSelectedChat(parentFromList);
      }
      return;
    }

    if (!supabase) return;

    try {
      const api = await import('../api');
      const res = await api.fetchWithAuth(supabase, `/chats/${parentId}`);
      if (res.ok) {
        const payload = await res.json();
        const parentChat = Array.isArray(payload)
          ? payload.find((chat) => chat.id === parentId)
          : payload?.chat || payload;

        if (parentChat) {
          if (onChatsUpdate) {
            onChatsUpdate((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              if (list.some((c) => c.id === parentChat.id)) {
                return list;
              }
              return [parentChat, ...list];
            });
          }
          if (setSelectedChat) {
            setSelectedChat(parentChat);
          }
        }
      }
    } catch (err) {
      console.error('Failed to navigate to parent chat:', err);
    }
  };

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
            const res = await (await import('../api')).fetchWithAuth(supabase, '/messages', {
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
              // Refresh graphs list to update date
              if (onGraphsRefresh) {
                onGraphsRefresh(true);
              }
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

  const handleTitleEditStart = () => {
    setIsEditingTitle(true);
    setEditTitleValue(selectedChat?.title || "");
  };

  const handleTitleEditSave = async () => {
    if (!selectedChat || !supabase || !editTitleValue.trim()) {
      setIsEditingTitle(false);
      setEditTitleValue(selectedChat?.title || "");
      return;
    }

    if (editTitleValue.trim() === selectedChat.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const api = await import('../api');
      const res = await api.fetchWithAuth(supabase, `/chats/${selectedChat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (onChatsUpdate) {
          onChatsUpdate((prev) => prev.map((c) => (c.id === selectedChat.id ? updated.chat : c)));
        }
        if (setSelectedChat) {
          setSelectedChat(updated.chat);
        }
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }

        if (!selectedChat.parent_id && selectedChat.graph_id) {
          try {
            const graphRes = await api.fetchWithAuth(supabase, `/graphs/${selectedChat.graph_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: editTitleValue.trim() }),
            });

            if (graphRes.ok) {
              const graphPayload = await graphRes.json();
              const rootChat = graphPayload?.rootChat;
              if (rootChat && onChatsUpdate) {
                onChatsUpdate((prev) => prev.map((c) => (c.id === rootChat.id ? rootChat : c)));
              }
              if (rootChat && setSelectedChat) {
                setSelectedChat(rootChat);
              }
            }
          } catch (err) {
            console.error('Failed to sync graph title from chat view:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update chat title:', err);
    }

    setIsEditingTitle(false);
  };

  const handleTitleEditCancel = () => {
    setIsEditingTitle(false);
    setEditTitleValue(selectedChat?.title || "");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (typeof onClose === "function") onClose();
            }}
            className="cg-button secondary"
            title="Back to Graph"
          >
            ← Graph
          </button>

          <button
            onClick={handleNavigateToParent}
            className="cg-button secondary"
            disabled={!selectedChat?.parent_id}
            title="Go to parent chat"
            style={{ opacity: selectedChat?.parent_id ? 1 : 0.5 }}
            type="button"
          >
            ↑ Parent
          </button>

          {isEditingTitle ? (
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onBlur={handleTitleEditSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.target.blur();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleTitleEditCancel();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                background: "var(--cg-input-bg)",
                border: "2px solid var(--cg-primary)",
                borderRadius: "4px",
                padding: "4px 8px",
                color: "var(--cg-text)",
                fontSize: "inherit",
                fontWeight: 700,
                outline: "none",
                minWidth: "150px",
              }}
            />
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--cg-text)" }}>
                {selectedChat?.title || "Chat"}
              </div>
              <button
                onClick={handleTitleEditStart}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Edit chat title"
              >
                <img src={pencilIcon} alt="Edit" style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          )}
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text || ""}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <button
          className="cg-button secondary"
          onClick={handleBranchChat}
          disabled={!selectedChat || !supabase || sending}
          style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          title="Branch this chat"
          type="button"
        >
          <img src={plusIcon} alt="Branch" style={{ width: 16, height: 16 }} />
          Branch
        </button>
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