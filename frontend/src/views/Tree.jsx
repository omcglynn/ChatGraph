import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import pencilIcon from "../assets/pencil-1.svg";
import plusIcon from "../assets/plus.svg";
import trashIcon from "../assets/trash-3.svg";

// Simple Chat Node Component
const ChatNode = ({ data }) => {
  const {
    label,
    isEditing,
    initialEditValue,
    showButtons,
    showDeleteConfirm,
    onEditStart,
    onEditSave,
    onEditCancel,
    onCreateChild,
    onDeleteClick,
    onDeleteConfirm,
    onDeleteCancel,
  } = data;

  // Use local state for the input value to prevent re-renders from triggering saves
  const [localEditValue, setLocalEditValue] = React.useState(initialEditValue || "");
  
  // Sync local value when editing starts
  React.useEffect(() => {
    if (isEditing) {
      setLocalEditValue(initialEditValue || "");
    }
  }, [isEditing, initialEditValue]);

  const handleSave = () => {
    onEditSave(localEditValue);
  };

  const handleCancel = () => {
    setLocalEditValue(initialEditValue || "");
    onEditCancel();
  };

  return (
    <div
      style={{
        position: "relative",
        padding: 8,
        fontWeight: 700,
        color: "var(--cg-text)",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        minWidth: "100%",
      }}
      onMouseDown={(e) => {
        if (isEditing || showButtons || showDeleteConfirm) {
          e.stopPropagation();
        }
      }}
    >
      <Handle type="target" position={Position.Top} id="top" style={{ background: "transparent" }} />
      
      {isEditing ? (
        <input
          type="text"
          value={localEditValue}
          onChange={(e) => {
            e.stopPropagation();
            setLocalEditValue(e.target.value);
          }}
          onBlur={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              e.target.blur(); // This will trigger onBlur which calls handleSave
            } else if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
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
            fontWeight: "inherit",
            width: "100%",
            textAlign: "center",
            outline: "none",
          }}
        />
      ) : (
        <>
          <div
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              width: "100%",
              lineHeight: "1.4",
              hyphens: "auto",
            }}
          >
            {label}
          </div>
          {showButtons && (
            <div
              style={{
                display: "flex",
                gap: "4px",
                justifyContent: "center",
                marginTop: "8px",
                padding: "4px",
                background: "var(--cg-panel)",
                borderRadius: "6px",
                boxShadow: "var(--cg-shadow)",
                border: "1px solid var(--cg-border)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                e.stopPropagation();
                  onEditStart();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Edit chat name"
              >
                <img src={pencilIcon} alt="Edit" style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                type="button"
              onClick={(e) => {
                e.stopPropagation();
                  onCreateChild();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Create child chat"
              >
                <img src={plusIcon} alt="Add" style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Delete chat"
              >
                <img src={trashIcon} alt="Delete" style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          )}
          {showDeleteConfirm && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                width: "100%",
                boxSizing: "border-box",
                boxShadow: "var(--cg-shadow)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "0.85rem", marginBottom: "8px", color: "var(--cg-text)", textAlign: "left" }}>
                Delete "{label}"? This will delete all child chats as well.
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                  e.stopPropagation();
                    onDeleteConfirm();
                }}
                style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Delete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                    onDeleteCancel();
                  }}
                  style={{
                    background: "var(--cg-panel)",
                    color: "var(--cg-text)",
                    border: "1px solid var(--cg-border)",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "transparent" }} />
    </div>
  );
};

// Root Node Component
const RootNode = ({ data }) => {
  const {
    label,
    isEditing,
    editValue,
    showButtons,
    showDeleteConfirm,
    onEditStart,
    onEditSave,
    onEditCancel,
    onCreateChild,
    onDeleteClick,
    onDeleteConfirm,
    onDeleteCancel,
  } = data;

  // Use local state for the input value
  const [localEditValue, setLocalEditValue] = React.useState(editValue || "");
  
  // Sync local value when editing starts
  React.useEffect(() => {
    if (isEditing) {
      setLocalEditValue(editValue || "");
    }
  }, [isEditing, editValue]);

  const handleSave = () => {
    onEditSave(localEditValue);
  };

  const handleCancel = () => {
    setLocalEditValue(editValue || "");
    onEditCancel();
  };

  return (
    <div
      style={{
        position: "relative",
        padding: 10,
        fontWeight: "bold",
        textAlign: "center",
                }}
                onMouseDown={(e) => {
        if (isEditing || showButtons || showDeleteConfirm) {
                  e.stopPropagation();
        }
      }}
    >
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "transparent" }} />
      
      {isEditing ? (
        <input
          type="text"
          value={localEditValue}
          onChange={(e) => {
            e.stopPropagation();
            setLocalEditValue(e.target.value);
          }}
          onBlur={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              e.target.blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
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
            fontWeight: "inherit",
            width: "100%",
            textAlign: "center",
            outline: "none",
          }}
        />
      ) : (
        <>
          <div>{label}</div>
          {showButtons && (
            <div
              style={{
                display: "flex",
                gap: "4px",
                justifyContent: "center",
                marginTop: "8px",
                padding: "4px",
                background: "var(--cg-panel)",
                borderRadius: "6px",
                boxShadow: "var(--cg-shadow)",
                border: "1px solid var(--cg-border)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditStart();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Edit graph name"
              >
                <img src={pencilIcon} alt="Edit" style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateChild();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Create root chat"
              >
                <img src={plusIcon} alt="Add" style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                }}
                title="Delete graph"
              >
                <img src={trashIcon} alt="Delete" style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          )}
          {showDeleteConfirm && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                width: "100%",
                boxSizing: "border-box",
                boxShadow: "var(--cg-shadow)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "0.85rem", marginBottom: "8px", color: "var(--cg-text)", textAlign: "left" }}>
                Delete "{label}"? This will delete all chats in this graph.
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    onDeleteConfirm();
                    }}
                    style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Delete
                  </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCancel();
                  }}
                  style={{
                    background: "var(--cg-panel)",
                    color: "var(--cg-text)",
                    border: "1px solid var(--cg-border)",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function Tree({
  chats,
  selectedChat,
  setSelectedChat,
  setShowChat,
  selectedGraph,
  loading,
  supabase,
  onChatsUpdate,
  onGraphsUpdate,
  setSelectedGraph,
  onGraphsRefresh,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getViewport, setViewport } = useReactFlow();
  
  // Simple state management
  const [editingChatId, setEditingChatId] = useState(null);
  const [hoveredChatId, setHoveredChatId] = useState(null);
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState(null);
  const [hasFittedView, setHasFittedView] = useState(false);
  
  // Root node state management
  const [isRootHovered, setIsRootHovered] = useState(false);
  const [isRootEditing, setIsRootEditing] = useState(false);
  const [rootEditValue, setRootEditValue] = useState("");
  const [showRootDeleteConfirm, setShowRootDeleteConfirm] = useState(false);
  
  // Use refs to track hover timeouts to prevent rapid state changes
  const hoverTimeoutRef = useRef(null);
  const rootHoverTimeoutRef = useRef(null);
  const rootHoverActiveRef = useRef(false);

  const nodeTypes = useMemo(
    () => ({
      chat: ChatNode,
      root: RootNode,
    }),
    []
  );

  // Helper to get all descendant chat IDs (for cascading delete in frontend)
  const getDescendantIds = useCallback((chatId, allChats) => {
    const descendants = [];
    const findChildren = (parentId) => {
      const children = allChats.filter((c) => c.parent_id === parentId);
      children.forEach((child) => {
        descendants.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(chatId);
    return descendants;
  }, []);

  // Edit chat name
  const handleEditStart = useCallback((chatId) => {
    setEditingChatId(chatId);
  }, []);

  const handleEditSave = useCallback(async (newValue) => {
    if (!editingChatId || !newValue || !newValue.trim()) {
      setEditingChatId(null);
      return;
    }

    if (!supabase) {
      console.error("Supabase client not available for editing");
      setEditingChatId(null);
      return;
    }

    const chat = chats.find((c) => c.id === editingChatId);
    if (!chat || newValue.trim() === chat.title) {
      setEditingChatId(null);
      return;
    }

    try {
      const api = await import("../api");
      const res = await api.fetchWithAuth(supabase, `/api/chats/${editingChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newValue.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (onChatsUpdate) {
          onChatsUpdate((prev) => prev.map((c) => (c.id === editingChatId ? updated.chat : c)));
        }
        if (selectedChat?.id === editingChatId) {
          setSelectedChat(updated.chat);
        }
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }
      }
    } catch (err) {
      console.error("Failed to update chat title:", err);
    }

    setEditingChatId(null);
  }, [editingChatId, chats, supabase, onChatsUpdate, selectedChat, setSelectedChat, onGraphsRefresh]);

  const handleEditCancel = useCallback(() => {
    setEditingChatId(null);
  }, []);

  // Create child chat
  const handleCreateChild = useCallback(
    async (parentChatId) => {
      if (!selectedGraph || !supabase) {
        console.error("Cannot create child: missing graph or supabase client");
        return;
      }

      // Save current viewport to restore it after update
      const currentViewport = getViewport();

      try {
        const api = await import("../api");
        const parentChat = chats.find((c) => c.id === parentChatId);
        const title = `Branch from ${parentChat?.title || "Chat"}`;
        const res = await api.fetchWithAuth(supabase, "/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            graphId: selectedGraph.id,
            title,
            parentId: parentChatId,
          }),
        });

      if (res.ok) {
          const payload = await res.json();
          const created = payload?.chat || payload;
        if (onChatsUpdate) {
            onChatsUpdate((prev) => [created, ...prev]);
          }
        // Restore viewport after a brief delay to allow nodes to update
        setTimeout(() => {
          setViewport(currentViewport, { duration: 0 });
        }, 100);
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }
      }
    } catch (err) {
      console.error("Failed to create child chat:", err);
    }
  },
  [selectedGraph, chats, supabase, onChatsUpdate, getViewport, setViewport, onGraphsRefresh]
);

  // Root node handlers
  const handleRootEditStart = useCallback(() => {
    setIsRootEditing(true);
    setRootEditValue(selectedGraph?.title || "");
  }, [selectedGraph]);

  const handleRootEditSave = useCallback(async (newValue) => {
    if (!selectedGraph || !newValue || !newValue.trim() || !supabase) {
      setIsRootEditing(false);
      setRootEditValue("");
      return;
    }

    if (newValue.trim() === selectedGraph.title) {
      setIsRootEditing(false);
      setRootEditValue("");
      return;
    }

    try {
      const api = await import("../api");
      const res = await api.fetchWithAuth(supabase, `/api/graphs/${selectedGraph.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newValue.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (onGraphsUpdate) {
          onGraphsUpdate((prev) => prev.map((g) => (g.id === selectedGraph.id ? updated.graph : g)));
        }
        if (setSelectedGraph) {
          setSelectedGraph(updated.graph);
        }
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }
      }
    } catch (err) {
      console.error("Failed to update graph title:", err);
    }

    setIsRootEditing(false);
    setRootEditValue("");
  }, [selectedGraph, supabase, onGraphsUpdate, setSelectedGraph, onGraphsRefresh]);

  const handleRootEditCancel = useCallback(() => {
    setIsRootEditing(false);
    setRootEditValue("");
  }, []);

  const handleRootCreateChild = useCallback(async () => {
    if (!selectedGraph || !supabase) {
      console.error("Cannot create root chat: missing graph or supabase client");
      return;
    }

    // Save current viewport to restore it after update
    const currentViewport = getViewport();

    try {
      const api = await import("../api");
      const title = "New Chat";
      const res = await api.fetchWithAuth(supabase, "/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          graphId: selectedGraph.id,
          title,
          parentId: null, // Root chat has no parent
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        const created = payload?.chat || payload;
        if (onChatsUpdate) {
          onChatsUpdate((prev) => [created, ...prev]);
        }
        // Restore viewport after a brief delay to allow nodes to update
        setTimeout(() => {
          setViewport(currentViewport, { duration: 0 });
        }, 100);
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }
      }
    } catch (err) {
      console.error("Failed to create root chat:", err);
    }
  }, [selectedGraph, supabase, onChatsUpdate, getViewport, setViewport, onGraphsRefresh]);

  const handleRootDeleteConfirm = useCallback(async () => {
    if (!selectedGraph || !supabase) {
      console.error("Supabase client not available for graph deletion");
      setShowRootDeleteConfirm(false);
      return;
    }

    try {
      const api = await import("../api");
      const res = await api.fetchWithAuth(supabase, `/api/graphs/${selectedGraph.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onGraphsUpdate) {
          onGraphsUpdate((prev) => prev.filter((g) => g.id !== selectedGraph.id));
        }
        if (setSelectedGraph) {
          setSelectedGraph(null);
        }
        if (onChatsUpdate) {
          onChatsUpdate([]);
        }
        if (setSelectedChat) {
          setSelectedChat(null);
        }
        if (setShowChat) {
          setShowChat(false);
        }
      }
    } catch (err) {
      console.error("Failed to delete graph:", err);
    }

    setShowRootDeleteConfirm(false);
  }, [selectedGraph, supabase, onGraphsUpdate, setSelectedGraph, onChatsUpdate, setSelectedChat, setShowChat]);

  // Delete chat (cascading)
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmChatId) return;

    if (!supabase) {
      console.error("Supabase client not available for deletion");
      setDeleteConfirmChatId(null);
      return;
    }

    try {
      const api = await import("../api");
      const res = await api.fetchWithAuth(supabase, `/api/chats/${deleteConfirmChatId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Get all descendant IDs to remove from state
        const descendantIds = getDescendantIds(deleteConfirmChatId, chats);
        const idsToRemove = [deleteConfirmChatId, ...descendantIds];

        if (onChatsUpdate) {
          onChatsUpdate((prev) => prev.filter((c) => !idsToRemove.includes(c.id)));
        }

        if (idsToRemove.includes(selectedChat?.id)) {
          setSelectedChat(null);
          setShowChat && setShowChat(false);
        }
        // Refresh graphs list to update date
        if (onGraphsRefresh) {
          onGraphsRefresh(true);
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }

    setDeleteConfirmChatId(null);
  }, [deleteConfirmChatId, supabase, chats, getDescendantIds, onChatsUpdate, selectedChat, setSelectedChat, setShowChat, onGraphsRefresh]);

  // Build tree structure from chats using parent_id relationships
  useEffect(() => {
    if (!selectedGraph || loading) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodesList = [];
    const edgesList = [];

    // Filter chats for this graph
    const graphChats = (chats || []).filter((c) => c.graph_id === selectedGraph.id);

    // Build a map of chats by ID
    const chatMap = new Map();
    graphChats.forEach((chat) => {
      chatMap.set(chat.id, { ...chat, children: [] });
    });

    // Build parent-child relationships
    const rootChats = [];
    chatMap.forEach((chat) => {
      if (chat.parent_id) {
        const parent = chatMap.get(chat.parent_id);
        if (parent) {
          parent.children.push(chat);
        } else {
          // Parent not in this graph, treat as root
          rootChats.push(chat);
        }
      } else {
        rootChats.push(chat);
      }
    });

    // Layout constants
    const NODE_WIDTH = 200; // Base width for nodes (allows wrapping)
    const NODE_WIDTH_EXPANDED = 280; // Width when delete confirmation is shown
    const NODE_HEIGHT = 80;
    const HORIZONTAL_SPACING = 80; // Increased spacing to prevent overlaps
    const VERTICAL_SPACING = 140; // Increased to accommodate wrapped text
    const ROOT_Y = 50;

    // Calculate node width based on state
    // Nodes expand when showing delete confirmation
    const getNodeWidth = (showDeleteConfirm) => {
      return showDeleteConfirm ? NODE_WIDTH_EXPANDED : NODE_WIDTH;
    };

    // First pass: Calculate subtree widths and positions
    const calculateLayout = (chat, depth = 0) => {
      const children = chat.children || [];
      // Check if this node is showing delete confirmation
      const isShowingDeleteConfirm = deleteConfirmChatId === chat.id;
      const nodeWidth = getNodeWidth(isShowingDeleteConfirm);
      
      if (children.length === 0) {
        // Leaf node: width is just the node width
        chat._layout = {
          width: nodeWidth,
          x: 0, // Will be set in second pass
          y: ROOT_Y + depth * VERTICAL_SPACING,
          nodeWidth,
        };
        return nodeWidth;
      }

      // Calculate layout for all children first
      let childrenWidth = 0;
      const childLayouts = [];
      children.forEach((child) => {
        const childWidth = calculateLayout(child, depth + 1);
        childLayouts.push({
          chat: child,
          width: childWidth,
        });
        childrenWidth += childWidth;
      });

      // Add spacing between children
      if (children.length > 1) {
        childrenWidth += (children.length - 1) * HORIZONTAL_SPACING;
      }

      // Parent width is max of its own width and children width
      const subtreeWidth = Math.max(nodeWidth, childrenWidth);
      
      chat._layout = {
        width: subtreeWidth,
        x: 0, // Will be set in second pass
        y: ROOT_Y + depth * VERTICAL_SPACING,
        nodeWidth,
        childrenWidth,
        childLayouts,
      };

      return subtreeWidth;
    };

    // Second pass: Set actual x positions
    const setPositions = (chat, startX = 0) => {
      const layout = chat._layout;
      const children = chat.children || [];

      if (children.length === 0) {
        // Leaf node: center it at startX
        layout.x = startX + layout.width / 2 - layout.nodeWidth / 2;
      } else {
        // Position children first
        let currentX = startX;
        layout.childLayouts.forEach((childLayout) => {
          setPositions(childLayout.chat, currentX);
          currentX += childLayout.width + HORIZONTAL_SPACING;
        });

        // Position parent: center it over its children
        const childrenStart = startX;
        const childrenEnd = currentX - HORIZONTAL_SPACING;
        const childrenCenter = (childrenStart + childrenEnd) / 2;
        layout.x = childrenCenter - layout.nodeWidth / 2;

        // If parent is wider than children, adjust children positions
        if (layout.nodeWidth > layout.childrenWidth) {
          const adjustment = (layout.nodeWidth - layout.childrenWidth) / 2;
          children.forEach((child) => {
            child._layout.x += adjustment;
            adjustChildPositions(child, adjustment);
          });
        }
      }
    };

    // Helper to adjust child positions recursively
    const adjustChildPositions = (chat, adjustment) => {
      const children = chat.children || [];
      children.forEach((child) => {
        child._layout.x += adjustment;
        adjustChildPositions(child, adjustment);
      });
    };

    // Calculate layouts for all root chats
    rootChats.forEach((chat) => {
      calculateLayout(chat, 1);
    });

    // Calculate total width needed
    let totalWidth = 0;
    if (rootChats.length > 0) {
      rootChats.forEach((chat) => {
        totalWidth += chat._layout.width;
      });
      if (rootChats.length > 1) {
        totalWidth += (rootChats.length - 1) * HORIZONTAL_SPACING;
      }
    }

    // Center the entire tree
    const treeStartX = -totalWidth / 2;

    // Set positions for all root chats
    let currentRootX = treeStartX;
    rootChats.forEach((chat) => {
      setPositions(chat, currentRootX);
      currentRootX += chat._layout.width + HORIZONTAL_SPACING;
    });

    // Build nodes and edges from calculated positions
    const buildNodesAndEdges = (chat, parentNodeId = null) => {
      const nodeId = `chat-${chat.id}`;
      const layout = chat._layout;

      const isEditing = editingChatId === chat.id;
      const isHovered = hoveredChatId === chat.id;
      const isSelected = selectedChat?.id === chat.id;
      const showButtons = (isHovered || isSelected) && !deleteConfirmChatId && !isEditing;
      const showDeleteConfirm = deleteConfirmChatId === chat.id;

      nodesList.push({
        id: nodeId,
        type: "chat",
        position: { x: layout.x, y: layout.y },
        data: { 
          label: chat.title || "Untitled Chat",
        chatId: chat.id,
          isEditing,
          initialEditValue: chat.title || "",
          showButtons,
          showDeleteConfirm,
          onEditStart: () => handleEditStart(chat.id),
          onEditSave: handleEditSave,
          onEditCancel: handleEditCancel,
          onCreateChild: () => handleCreateChild(chat.id),
          onDeleteClick: () => setDeleteConfirmChatId(chat.id),
          onDeleteConfirm: handleDeleteConfirm,
          onDeleteCancel: () => setDeleteConfirmChatId(null),
        },
        draggable: !isEditing && !showButtons && !showDeleteConfirm,
        style: {
          background: "var(--cg-node-chat-bg)",
          border: "3px solid var(--cg-node-chat-border)",
          borderRadius: "10px",
          padding: "10px",
          fontWeight: "bold",
          textAlign: "center",
          cursor: isEditing || showButtons || showDeleteConfirm ? "default" : "move",
          width: showDeleteConfirm ? `${NODE_WIDTH_EXPANDED}px` : `${NODE_WIDTH}px`,
          minHeight: `${NODE_HEIGHT}px`,
          transition: "width 0.2s ease",
        },
      });

      // Add edge from parent
      if (parentNodeId) {
        edgesList.push({
          id: `edge-${parentNodeId}-${nodeId}`,
          source: parentNodeId,
          target: nodeId,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          animated: true,
        });
      }

      // Recursively build children
      const children = chat.children || [];
      children.forEach((child) => {
        buildNodesAndEdges(child, nodeId);
      });
    };

    // Add root node (centered above all root chats)
        const rootId = `root-${selectedGraph.id}`;
    let rootNodeX = 0;
    if (rootChats.length > 0) {
      // Calculate average x position of root chats
      const sumX = rootChats.reduce((sum, chat) => sum + chat._layout.x, 0);
      rootNodeX = sumX / rootChats.length;
    }
    
    const showRootButtons = isRootHovered && !showRootDeleteConfirm && !isRootEditing;
      
        nodesList.push({
          id: rootId,
      type: "root",
      position: { x: rootNodeX, y: ROOT_Y },
      data: {
        label: selectedGraph.title || "Graph",
        isEditing: isRootEditing,
        editValue: rootEditValue,
        showButtons: showRootButtons,
        showDeleteConfirm: showRootDeleteConfirm,
        onEditStart: handleRootEditStart,
        onEditSave: handleRootEditSave,
        onEditCancel: handleRootEditCancel,
        onCreateChild: handleRootCreateChild,
        onDeleteClick: () => setShowRootDeleteConfirm(true),
        onDeleteConfirm: handleRootDeleteConfirm,
        onDeleteCancel: () => setShowRootDeleteConfirm(false),
      },
          style: {
            background: "var(--cg-node-root-bg)",
            border: "2px solid var(--cg-node-root-border)",
            borderRadius: "10px",
            padding: "10px",
            fontWeight: "bold",
          },
        });

    // Build tree for each root chat
    rootChats.forEach((chat) => {
      buildNodesAndEdges(chat, rootId);
    });

    setNodes(nodesList);
    setEdges(edgesList);
  }, [
    selectedGraph,
    chats,
    editingChatId,
    hoveredChatId,
    deleteConfirmChatId,
    selectedChat,
    isRootHovered,
    isRootEditing,
    rootEditValue,
    showRootDeleteConfirm,
    setNodes,
    setEdges,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleCreateChild,
    handleDeleteConfirm,
    handleRootEditStart,
    handleRootEditSave,
    handleRootEditCancel,
    handleRootCreateChild,
    handleRootDeleteConfirm,
    loading,
  ]);

  // Fit view once when graph is first loaded
  useEffect(() => {
    if (nodes.length > 0 && selectedGraph && !hasFittedView && !loading) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400, minZoom: 0.5, maxZoom: 1.5 });
        setHasFittedView(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, selectedGraph, hasFittedView, loading, fitView]);

  // Reset fit view flag when graph changes
  useEffect(() => {
    setHasFittedView(false);
  }, [selectedGraph?.id]);

  // Cleanup hover timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (rootHoverTimeoutRef.current) {
        clearTimeout(rootHoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle node click
  const handleNodeClick = useCallback(
    (event, node) => {
      if (node.type === "chat") {
        if (editingChatId === node.data.chatId || deleteConfirmChatId === node.data.chatId) {
          return;
        }

        const chat = chats.find((c) => c.id === node.data.chatId);
        if (chat && selectedChat?.id !== chat.id) {
          setSelectedChat(chat);
          setShowChat && setShowChat(true);
        }
      }
    },
    [chats, selectedChat, setSelectedChat, setShowChat, editingChatId, deleteConfirmChatId]
  );

  // Minimap colors
  const minimapColors = useMemo(() => {
    try {
      const s = getComputedStyle(document.documentElement);
      return {
        nodeColor: s.getPropertyValue("--cg-node-chat-bg")?.trim() || "#93c5fd",
        nodeStroke: s.getPropertyValue("--cg-node-chat-border")?.trim() || "#3b82f6",
        mask: s.getPropertyValue("--cg-panel")?.trim() || "#ffffff",
      };
    } catch {
      return { nodeColor: "#93c5fd", nodeStroke: "#3b82f6", mask: "#ffffff" };
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
        width: "100%", 
        height: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
          color: "var(--cg-muted)",
        }}
      >
        Loading graph...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(event, node) => {
          if (node.type === "chat") {
            // Clear any pending timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
            setHoveredChatId(node.data.chatId);
          } else if (node.type === "root") {
            // Clear any pending timeout for root node
            if (rootHoverTimeoutRef.current) {
              clearTimeout(rootHoverTimeoutRef.current);
              rootHoverTimeoutRef.current = null;
            }
            // Mark as actively hovered
            rootHoverActiveRef.current = true;
            // Set hover state immediately to prevent glitches
            setIsRootHovered(true);
          }
        }}
        onNodeMouseLeave={(event, node) => {
          if (node.type === "chat") {
            // Add a small delay before clearing hover to prevent rapid state changes
            // This prevents nodes from disappearing when moving quickly between nodes
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredChatId(null);
              hoverTimeoutRef.current = null;
            }, 100);
          } else if (node.type === "root") {
            // Mark as not actively hovered
            rootHoverActiveRef.current = false;
            // Add a delay before clearing root hover to prevent glitches during node rebuilds
            // Use a longer timeout than chat nodes since root node rebuilds can take longer
            if (rootHoverTimeoutRef.current) {
              clearTimeout(rootHoverTimeoutRef.current);
            }
            rootHoverTimeoutRef.current = setTimeout(() => {
              // Only clear if mouse hasn't re-entered
              if (!rootHoverActiveRef.current) {
                setIsRootHovered(false);
              }
              rootHoverTimeoutRef.current = null;
            }, 150);
          }
        }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <MiniMap
          nodeColor={() => minimapColors.nodeColor}
          nodeStrokeColor={() => minimapColors.nodeStroke}
          maskColor={minimapColors.mask}
        />
  <Controls />
  <Background gap={20} />
      </ReactFlow>
    </div>
  );
}
