import React, { useState, useEffect, useCallback, useRef } from "react";
import Tree from "./Tree"; 
import Chat from "./Chat"; 
import NewChat from "./newChat";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/index.css";
import { ReactFlowProvider } from "@xyflow/react";
import { formatDate } from "../utils/dateFormatter";
import pencilIcon from "../assets/icons/pencil-1.svg";
import trashIcon from "../assets/icons/trash-3.svg";
import plusIcon from "../assets/icons/plus.svg";

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
  // Track editing state for graph titles
  const [editingGraphId, setEditingGraphId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  // Track if graphs have been loaded to prevent reload on focus
  const graphsLoadedRef = useRef(false);
  // Track deletion confirmation
  const [deletingGraphId, setDeletingGraphId] = useState(null);

  const loadChatsForGraph = useCallback(async (graphId, force = false) => {
    if (!user || !supabase || !graphId) {
      // Clear chats if no graphId provided
      setChats([]);
      setSelectedChat(null);
      setShowChat(false);
      return;
    }
    
    // Don't reload if we're already viewing this graph and force is false
    if (!force && selectedGraph?.id === graphId) {
      return;
    }
    
    setLoadingChats(true);
    // Clear old chats immediately to prevent showing stale data
    setChats([]);
    setSelectedChat(null);
    setShowChat(false);
    
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
          const createRootRes = await api.fetchWithAuth(supabase, '/chats', {
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
      
      // If a desired chat id was parsed from the URL, only select it if it belongs to this graph/user
      if (desiredChatId) {
        const foundChat = chatsData.find((ch) => ch.id === desiredChatId);
        if (foundChat) {
          setSelectedChat(foundChat);
          setShowChat(true);
        }
        setDesiredChatId(null);
      }
    } catch (err) {
      console.error("Failed to fetch chats for graph:", err);
      // On error, ensure chats are cleared
      setChats([]);
    }
    finally {
      setLoadingChats(false);
    }
  }, [user, supabase, desiredChatId, selectedGraph, graphs]);

  // Track the last user ID to detect user changes
  const lastUserIdRef = useRef(null);

  // Extract loadGraphs as a reusable function
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

  useEffect(() => {
    // load user's graphs on mount or when user changes
    loadGraphs();
  }, [loadGraphs]);

  // Restore graph/chat from URL after graphs are loaded
  useEffect(() => {
    if (!desiredGraphId || !graphs.length || graphsLoadedRef.current === false) return;
    
    const found = graphs.find((gg) => gg.id === desiredGraphId);
    if (found && !selectedGraph) {
      setSelectedGraph(found);
      setShowNewChat(false);
      loadChatsForGraph(found.id, true);
    } else if (!found) {
      setDesiredGraphId(null);
    }
  }, [desiredGraphId, graphs, selectedGraph, loadChatsForGraph]);

  // Parse URL params once on mount to restore graph/chat selection if present
  useEffect(() => {
    try {
      const path = window.location.pathname;
      
      // Check for /newchat route
      if (path === '/newchat' || path === '/newchat/') {
        setShowNewChat(true);
        setSelectedChat(null);
        setSelectedGraph(null);
        setShowChat(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const g = params.get('graph');
      const c = params.get('chat');
      if (g) setDesiredGraphId(g);
      if (c) setDesiredChatId(c);

      // also support pretty path format: /g/:graphId or /g/:graphId/c/:chatId
      const pathMatch = path.match(new RegExp('^/g/([^/]+)(?:/c/([^/]+))?/?$'));
      if (pathMatch) {
        if (!g) setDesiredGraphId(pathMatch[1]);
        if (!c && pathMatch[2]) setDesiredChatId(pathMatch[2]);
      }
    } catch {
      // ignore malformed URLs
    }
  }, []);

  // Listen for popstate events (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/newchat' || path === '/newchat/') {
        setShowNewChat(true);
        setSelectedChat(null);
        setSelectedGraph(null);
        setShowChat(false);
      } else {
        // Re-parse URL for graph/chat selection
        try {
          const params = new URLSearchParams(window.location.search);
          const g = params.get('graph');
          const c = params.get('chat');
          if (g) setDesiredGraphId(g);
          if (c) setDesiredChatId(c);
          
          const pathMatch = path.match(new RegExp('^/g/([^/]+)(?:/c/([^/]+))?/?$'));
          if (pathMatch) {
            if (!g) setDesiredGraphId(pathMatch[1]);
            if (!c && pathMatch[2]) setDesiredChatId(pathMatch[2]);
          }
        } catch {
          // ignore malformed URLs
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  
  // Filter graphs based on search term (title)
  const filteredGraphs = graphs.filter((g) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (g.title || "").toLowerCase().includes(lowerSearch);
  });

  // keep URL in sync with selection so reload/links restore state
  const updateUrl = (gId, cId, isNewChat = false) => {
    try {
      let newUrl = '/';
      if (isNewChat) {
        newUrl = '/newchat';
      } else if (gId && cId) {
        newUrl = `/g/${gId}/c/${cId}`;
      } else if (gId) {
        newUrl = `/g/${gId}`;
      }
      window.history.replaceState(null, '', newUrl);
    } catch {
      // ignore URL update failures
    }
  };

  // whenever the selectedGraph/chat or showNewChat changes, update the URL (safely)
  useEffect(() => {
    if (showNewChat && !selectedChat) {
      updateUrl(null, null, true);
    } else if (selectedGraph && selectedChat && showChat) {
      updateUrl(selectedGraph.id, selectedChat.id);
    } else if (selectedGraph) {
      updateUrl(selectedGraph.id, null);
    } else {
      updateUrl(null, null);
    }
  }, [selectedGraph, selectedChat, showChat, showNewChat]);

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
                  onClick={(e) => {
                    // Don't trigger graph selection if clicking on buttons or input
                    if (e.target.closest('.chat-item-actions') || e.target.tagName === 'INPUT') return;
                    
                    // If clicking the same graph that's already selected, don't reload
                    if (selectedGraph?.id === g.id) {
                      // Just ensure we're showing the graph view (not chat view)
                      setShowChat(false);
                      return;
                    }
                    
                    // Clear state first
                    setSelectedChat(null);
                    setShowChat(false);
                    setShowNewChat(false);
                    // Then set new graph and load its chats
                    setSelectedGraph(g);
                    loadChatsForGraph(g.id, true);
                  }}
                  className={`chat-item ${selectedGraph?.id === g.id ? "selected" : ""}`}
                >
                  <div className="chat-item-content">
                    <div className="chat-item-title">
                      {editingGraphId === g.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={async () => {
                            if (editingTitle.trim() && editingTitle !== g.title) {
                              try {
                                const api = await import('../api');
                                const res = await api.fetchWithAuth(supabase, `/graphs/${g.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ title: editingTitle.trim() }),
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setGraphs((prev) =>
                                    prev.map((graph) =>
                                      graph.id === g.id ? updated.graph : graph
                                    )
                                  );
                                  // Update selected graph if it's the one being edited
                                  if (selectedGraph?.id === g.id) {
                                    setSelectedGraph(updated.graph);
                                  }
                                  if (updated.rootChat) {
                                    setChats((prev) =>
                                      (Array.isArray(prev) ? prev : []).map((chat) =>
                                        chat.id === updated.rootChat.id ? updated.rootChat : chat
                                      )
                                    );
                                    if (selectedChat?.id === updated.rootChat.id) {
                                      setSelectedChat(updated.rootChat);
                                    }
                                  }
                                  // Refresh graphs list to update date
                                  loadGraphs(true);
                                }
                              } catch (err) {
                                console.error('Failed to update graph title:', err);
                              }
                            }
                            setEditingGraphId(null);
                            setEditingTitle("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            } else if (e.key === 'Escape') {
                              setEditingGraphId(null);
                              setEditingTitle("");
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--cg-primary)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            width: '100%',
                          }}
                        />
                      ) : (
                        <span>{g.title}</span>
                      )}
                      <div className="chat-date">{formatDate(g.created_at)}</div>
                    </div>
                    {editingGraphId !== g.id && (
                      <div className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="chat-item-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGraphId(g.id);
                            setEditingTitle(g.title || "");
                          }}
                          title="Edit graph name"
                        >
                          <img src={pencilIcon} alt="Edit" style={{ width: "16px", height: "16px" }} />
                        </button>
                        <button
                          className="chat-item-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGraphId(g.id);
                          }}
                          title="Delete graph"
                        >
                          <img src={trashIcon} alt="Delete" style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    )}
                  </div>
                  {deletingGraphId === g.id && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--cg-text)' }}>
                        Delete "{g.title}"? This will delete all chats in this graph.
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="cg-button"
                          style={{ 
                            background: '#ef4444', 
                            padding: '4px 12px', 
                            fontSize: '0.85rem',
                            flex: 1
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const api = await import('../api');
                              const res = await api.fetchWithAuth(supabase, `/graphs/${g.id}`, {
                                method: 'DELETE',
                              });
                              if (res.ok) {
                                // Remove from list
                                setGraphs((prev) => prev.filter((graph) => graph.id !== g.id));
                                // If this was the selected graph, clear selection
                                if (selectedGraph?.id === g.id) {
                                  setSelectedGraph(null);
                                  setSelectedChat(null);
                                  setShowChat(false);
                                  setShowNewChat(true);
                                  setChats([]);
                                }
                                // Refresh graphs list to update dates
                                loadGraphs(true);
                              } else {
                                console.error('Failed to delete graph');
                              }
                            } catch (err) {
                              console.error('Error deleting graph:', err);
                            }
                            setDeletingGraphId(null);
                          }}
                        >
                          Delete
                        </button>
                        <button
                          className="cg-button secondary"
                          style={{ padding: '4px 12px', fontSize: '0.85rem', flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGraphId(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bottom-area">
          <button
            onClick={() => {
              // Navigate to /newchat route
              window.history.pushState(null, '', '/newchat');
              setShowNewChat(true);
              setSelectedChat(null);
              setShowChat(false);
              setSelectedGraph(null);
            }}
            className="start-chat"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <img src={plusIcon} alt="Add" style={{ width: "16px", height: "16px" }} />
            New Graph
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
              <NewChat supabase={supabase} onCreate={(graph, rootChat) => {
              // add newly created graph to sidebar list and select it
              setGraphs((prev) => [graph, ...(Array.isArray(prev) ? prev : [])]);
              setSelectedGraph(graph);
              setShowNewChat(false);
              if (rootChat) {
                setChats([rootChat]);
                setSelectedChat(rootChat);
                setShowChat(true);
              }
              loadChatsForGraph(graph.id, true);
              // Refresh graphs list to ensure proper sorting
              loadGraphs(true);
              // Navigate away from /newchat to the new graph
              updateUrl(graph.id, null);
            }} />
            ) : selectedChat ? (
            showChat ? (
              // Show the chat conversation pane when showChat is true
              <Chat
                selectedChat={selectedChat}
                onClose={() => { setShowChat(false); setSelectedChat(null); }}
                supabase={supabase}
                onChatsUpdate={setChats}
                setSelectedChat={setSelectedChat}
                onGraphsRefresh={loadGraphs}
                chats={chats}
              />
            ) : (
              // Otherwise show the tree for the selected chat
              <ReactFlowProvider>
                <Tree
                  chats={chats}
                  selectedGraph={selectedGraph}
                  selectedChat={selectedChat}
                  setSelectedChat={setSelectedChat}
                  setShowChat={setShowChat}
                  loading={loadingChats}
                  supabase={supabase}
                  onChatsUpdate={setChats}
                  onGraphsUpdate={setGraphs}
                  setSelectedGraph={setSelectedGraph}
                  onGraphsRefresh={loadGraphs}
                />
              </ReactFlowProvider>
            )
          ) : (
            <ReactFlowProvider>
              <Tree
                chats={chats}
                selectedGraph={selectedGraph}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
                setShowChat={setShowChat}
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
