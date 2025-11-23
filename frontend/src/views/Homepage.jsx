import React, { useState, useEffect, useCallback, useRef } from "react";
import Tree from "./Tree";
import NewChat from "./newChat";
import ThemeToggle from "../components/ThemeToggle";
import "../App.css";
import "../styles/index.css";
import { ReactFlowProvider } from "@xyflow/react";
import { formatDate } from "../utils/dateFormatter";

export default function Homepage({ user, onLogout, supabase }) {
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [graphs, setGraphs] = useState([]);
  const [chats, setChats] = useState([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [graphsError, setGraphsError] = useState(null);
  
  // Track if graphs have been loaded to prevent unnecessary reloads
  const graphsLoadedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // Load graphs from backend
  const loadGraphs = useCallback(async (force = false) => {
    if (!user || !supabase) {
      graphsLoadedRef.current = false;
      lastUserIdRef.current = null;
      setGraphs([]);
      return;
    }
    
    // Check if user changed
    const userIdChanged = lastUserIdRef.current !== user.id;
    lastUserIdRef.current = user.id;
    
    // Only reload if user changed, graphs haven't been loaded yet, or force is true
    if (!force && !userIdChanged && graphsLoadedRef.current) {
      return;
    }
    
    setLoadingGraphs(true);
    setGraphsError(null);
    try {
      const api = await import('../api');
      const res = await api.fetchWithAuth(supabase, '/graphs');
      if (!res.ok) throw new Error(`Failed to load graphs: ${res.status}`);
      const data = await res.json();
      setGraphs(Array.isArray(data) ? data : []);
      graphsLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to fetch graphs:", err);
      setGraphsError(err.message || String(err));
      graphsLoadedRef.current = false;
    } finally {
      setLoadingGraphs(false);
    }
  }, [user, supabase]);

  // Load chats for a selected graph
  const loadChatsForGraph = useCallback(async (graphId, force = false) => {
    if (!user || !supabase || !graphId) {
      setChats([]);
      setSelectedChat(null);
      return;
    }
    
    // Don't reload if we're already viewing this graph and force is false
    if (!force && selectedGraph?.id === graphId) {
      return;
    }
    
    setLoadingChats(true);
    setChats([]);
    setSelectedChat(null);
    
    try {
      const api = await import('../api');
      const res = await api.fetchWithAuth(supabase, `/chats/${graphId}`);
      
      if (!res.ok) {
        // If 404, it might be an empty graph (which is fine)
        if (res.status === 404) {
          setChats([]);
          return;
        }
        throw new Error(`Failed to load chats: ${res.status}`);
      }
      
      const data = await res.json();
      let chatsData = Array.isArray(data) ? data : [];

      // Ensure there's always a root chat (parent_id === null)
      if (!chatsData.some((chat) => chat?.parent_id == null)) {
        try {
          const graphMeta = graphs.find((g) => g.id === graphId) || selectedGraph;
          const rootTitle = graphMeta?.title || 'Root Chat';
          const createRootRes = await api.fetchWithAuth(supabase, '/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ graphId, title: rootTitle, parentId: null }),
          });

          if (createRootRes.ok) {
            const createdPayload = await createRootRes.json();
            const createdRoot = createdPayload?.chat || createdPayload;
            if (createdRoot) {
              chatsData = [createdRoot, ...chatsData];
            }
          }
        } catch (rootErr) {
          console.error('Failed to create root chat for graph:', rootErr);
        }
      }

      setChats(chatsData);
    } catch (err) {
      console.error("Failed to fetch chats for graph:", err);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [user, supabase, selectedGraph, graphs]);

  // Load graphs on mount or when user changes
  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  // Load chats when a graph is selected
  useEffect(() => {
    if (selectedGraph?.id) {
      loadChatsForGraph(selectedGraph.id, true);
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [selectedGraph, loadChatsForGraph]);

  // Filter graphs based on search term
  const filteredGraphs = graphs.filter((g) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (g.title || "").toLowerCase().includes(lowerSearch);
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--cg-bg)" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ overflowY: "auto", flexGrow: 1 }}>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Search graphs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="chat-list">
            {loadingGraphs ? (
              <div style={{ padding: 10, color: 'var(--cg-muted)' }}>Loading graphs...</div>
            ) : graphsError ? (
              <div style={{ padding: 10, color: 'var(--cg-muted)' }}>Error: {graphsError}</div>
            ) : (
              filteredGraphs.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    // If clicking the same graph that's already selected, don't reload
                    if (selectedGraph?.id === g.id) {
                      return;
                    }
                    
                    setSelectedChat(null);
                    setShowNewChat(false);
                    setSelectedGraph(g);
                    loadChatsForGraph(g.id, true);
                  }}
                  className={`chat-item ${selectedGraph?.id === g.id ? "selected" : ""}`}
                >
                  <div className="chat-item-content">
                    <div className="chat-item-title">
                      <span>{g.title}</span>
                      <div className="chat-date">{formatDate(g.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bottom-area">
          <button
            onClick={() => {
              setShowNewChat(true);
              setSelectedChat(null);
              setSelectedGraph(null);
            }}
            className="start-chat"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            💬 New Graph
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>
            Welcome, {user?.email || "User"}
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ThemeToggle />
            <button
              onClick={onLogout}
              style={{
                background: "#ef4444",
                color: "white",
                padding: "6px 14px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Conditionally render NewChat or Tree */}
        <div
          style={{
            background: "var(--cg-panel)",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "var(--cg-shadow)",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {showNewChat ? (
            <NewChat
              supabase={supabase}
              onCreate={(graph, rootChat) => {
                // Add newly created graph to sidebar list and select it
                setGraphs((prev) => [graph, ...(Array.isArray(prev) ? prev : [])]);
                setSelectedGraph(graph);
                setShowNewChat(false);
                if (rootChat) {
                  setChats([rootChat]);
                  setSelectedChat(rootChat);
                }
                loadChatsForGraph(graph.id, true);
                // Refresh graphs list to ensure proper sorting
                loadGraphs(true);
              }}
            />
          ) : (
            <ReactFlowProvider>
              <Tree
                chats={chats}
                selectedGraph={selectedGraph}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                loading={loadingChats}
                supabase={supabase}
                onChatsUpdate={setChats}
                onGraphsUpdate={setGraphs}
                setSelectedGraph={setSelectedGraph}
                onGraphsRefresh={loadGraphs}
              />
            </ReactFlowProvider>
          )}
        </div>
      </main>
    </div>
  );
}
