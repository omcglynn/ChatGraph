import React, { useState, useEffect, useCallback } from "react";
import Tree from "./Tree"; 
import Chat from "./Chat"; 
import NewChat from "./newChat";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/index.css";
import { ReactFlowProvider } from "@xyflow/react";

export default function Homepage({ supabase, user, onLogout }) {
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [graphs, setGraphs] = useState([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [graphsError, setGraphsError] = useState(null);

  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  // desired ids parsed from the URL on initial load; used to safely restore state
  const [desiredGraphId, setDesiredGraphId] = useState(null);
  const [desiredChatId, setDesiredChatId] = useState(null);

  const loadChatsForGraph = useCallback(async (graphId) => {
    if (!user || !supabase || !graphId) return;
    setLoadingChats(true);
    try {
      const api = await import('../api');
      // Prefer REST param style, but fall back to legacy query form if necessary
      let res = await api.fetchWithAuth(supabase, `/api/chats/${graphId}`);
      if (!res.ok) {
        res = await api.fetchWithAuth(supabase, `/api/chats?graphId=${graphId}`);
      }
      if (!res.ok) throw new Error(`Failed to load chats: ${res.status}`);
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
      // If a desired chat id was parsed from the URL, only select it if it belongs to this graph/user
      if (desiredChatId) {
        const foundChat = (Array.isArray(data) ? data : []).find((ch) => ch.id === desiredChatId);
        if (foundChat) {
          setSelectedChat(foundChat);
          setShowChat(true);
        }
        setDesiredChatId(null);
      }
    } catch (err) {
      console.error("Failed to fetch chats for graph:", err);
    }
    finally {
      setLoadingChats(false);
    }
  }, [user, supabase, desiredChatId]);

  useEffect(() => {
    // load user's graphs on mount or when user changes
    const loadGraphs = async () => {
      if (!user || !supabase) return;
      setLoadingGraphs(true);
      setGraphsError(null);
      try {
        const api = await import('../api');
        const res = await api.fetchWithAuth(supabase, '/api/graphs');
        if (!res.ok) throw new Error(`Failed to load graphs: ${res.status}`);
        const data = await res.json();
        setGraphs(Array.isArray(data) ? data : []);
        // If a graph id was present in the URL, only select it if it belongs to this user
        if (desiredGraphId) {
          const found = (Array.isArray(data) ? data : []).find((gg) => gg.id === desiredGraphId);
          if (found) {
              setSelectedGraph(found);
              // ensure we show the graph view (not the NewChat landing) when restoring from URL
              setShowNewChat(false);
              // load chats for the graph so we can also restore chat selection
              await loadChatsForGraph(found.id);
            } else {
            // clear desired id if not found to avoid accidental matches later
            setDesiredGraphId(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch graphs:", err);
        setGraphsError(err.message || String(err));
      } finally {
        setLoadingGraphs(false);
      }
    };

    loadGraphs();
  }, [user, supabase, desiredGraphId, loadChatsForGraph]);

  // Parse URL params once on mount to restore graph/chat selection if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('graph');
      const c = params.get('chat');
      if (g) setDesiredGraphId(g);
      if (c) setDesiredChatId(c);

      // also support pretty path format: /g/:graphId or /g/:graphId/c/:chatId
  const pathMatch = window.location.pathname.match(new RegExp('^/g/([^/]+)(?:/c/([^/]+))?/?$'));
      if (pathMatch) {
        if (!g) setDesiredGraphId(pathMatch[1]);
        if (!c && pathMatch[2]) setDesiredChatId(pathMatch[2]);
      }
    } catch {
      // ignore malformed URLs
    }
  }, []);


  
  // Filter graphs based on search term (title)
  const filteredGraphs = graphs.filter((g) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (g.title || "").toLowerCase().includes(lowerSearch);
  });

  // keep URL in sync with selection so reload/links restore state
  const updateUrl = (gId, cId) => {
    try {
      let newUrl = '/';
      if (gId && cId) newUrl = `/g/${gId}/c/${cId}`;
      else if (gId) newUrl = `/g/${gId}`;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // ignore URL update failures
    }
  };

  // whenever the selectedGraph/chat changes, update the URL (safely)
  useEffect(() => {
    if (selectedGraph && selectedChat && showChat) {
      updateUrl(selectedGraph.id, selectedChat.id);
    } else if (selectedGraph) {
      updateUrl(selectedGraph.id, null);
    } else {
      updateUrl(null, null);
    }
  }, [selectedGraph, selectedChat, showChat]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--cg-bg)" }}>
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
                  onClick={() => { setSelectedGraph(g); setShowNewChat(false); setShowChat(false); setSelectedChat(null); loadChatsForGraph(g.id); }}
                  className={`chat-item ${selectedGraph?.id === g.id ? "selected" : ""}`}
                >
                  {g.title}
                  <div className="chat-date">{g.created_at || g.date}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bottom-area">
          <button
            onClick={async () => {
              // Create a new graph on the server and select it
              try {
                // optimistic UI guard
                if (!supabase) {
                  // fallback: just show NewChat behavior
                  setShowNewChat(true);
                  setSelectedChat(null);
                  setShowChat(false);
                  setSelectedGraph(null);
                  return;
                }

                const res = await (await import('../api')).fetchWithAuth(supabase, '/api/graphs', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ title: 'New Graph' }),
                });

                if (!res.ok) {
                  console.error('Failed to create graph', res.status);
                  // fallback to opening NewChat so user can still start working
                  setShowNewChat(true);
                  setSelectedChat(null);
                  setShowChat(false);
                  setSelectedGraph(null);
                  return;
                }

                const created = await res.json();
                // created might be the object directly or wrapped; ensure shape
                const graph = created?.id ? created : created?.graph || created;

                // add to list and select it
                setGraphs((prev) => [graph, ...(Array.isArray(prev) ? prev : [])]);
                setSelectedGraph(graph);
                setShowNewChat(false);
                setShowChat(false);

                // load chats for the newly created graph (likely empty)
                try {
                  await loadChatsForGraph(graph.id);
                } catch {
                  // ignore load errors for new graph
                }
              } catch (err) {
                console.error('Error creating graph from sidebar:', err);
                setShowNewChat(true);
                setSelectedChat(null);
                setShowChat(false);
                setSelectedGraph(null);
              }
            }}
            className="start-chat"
          >
            ➕ New Graph
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

        {/* If a chat is selected, show the Chat view; otherwise show Tree */}
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
          {showNewChat && !selectedChat ? (
              <NewChat supabase={supabase} graphId={selectedGraph?.id} onCreate={(c) => {
              // add newly created chat to sidebar list
              setChats((prev) => [c, ...prev]);
              setShowNewChat(true);
              console.log("new graph created:", c);
            }} />
            ) : selectedChat ? (
            showChat ? (
              // Show the chat conversation pane when showChat is true
              <Chat
                selectedChat={selectedChat}
                  onClose={() => { setShowChat(false); setSelectedChat(null); }}
                supabase={supabase}
              />
            ) : (
              // Otherwise show the tree for the selected chat
              <ReactFlowProvider>
                <Tree
                  user={user}
                  chats={chats} // pass all chats for the selected graph so Tree builds the graph
                  selectedGraph={selectedGraph}
                  selectedChat={selectedChat}
                  setSelectedChat={setSelectedChat}
                  setShowChat={setShowChat} // <-- pass the setter so Tree can open Chat
                  loading={loadingChats}
                />
              </ReactFlowProvider>
            )
          ) : (
            <ReactFlowProvider>
              <Tree
                user={user}
                chats={chats}
                selectedGraph={selectedGraph}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                setShowChat={setShowChat}
              />
            </ReactFlowProvider>
          )}
        </div>
      </main>
    </div>
  );
}
