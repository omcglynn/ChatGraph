import React, { useState } from "react";

/**
 * NewChat component - simplified to create a new graph
 * Props:
 * - onCreate(graphObject) optional: called when a new graph is created
 */
export default function NewChat({ onCreate, supabase }) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const createGraph = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setCreating(true);

    try {
      if (supabase) {
        const res = await (await import('../api')).fetchWithAuth(supabase, '/api/graphs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle }),
        });
        
        if (!res.ok) {
          console.error('Failed to create graph on server', res.status);
          return;
        }
        
        const payload = await res.json();
        const createdGraph = payload?.graph || payload;
        const rootChat = payload?.rootChat || null;

        if (onCreate) {
          onCreate(createdGraph, rootChat);
        }
        
        setTitle('');
      }
    } catch (err) {
      console.error('Failed to create graph:', err);
    } finally {
      setCreating(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      createGraph();
    }
  };

  return (
    <div className="chat-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        flex: 1,
        padding: "40px 20px"
      }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Title"
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "20px 24px",
            fontSize: "24px",
            background: "var(--cg-input-bg)",
            border: "2px solid var(--cg-border)",
            borderRadius: "8px",
            color: "var(--cg-text)",
            outline: "none",
            marginBottom: "20px",
          }}
        />

        <button
          className="cg-button"
          onClick={createGraph}
          disabled={creating || !title.trim()}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "16px",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          {creating ? "Creating..." : "Create Graph"}
        </button>
      </div>
    </div>
  );
}