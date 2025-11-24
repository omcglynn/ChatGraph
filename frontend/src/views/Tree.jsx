
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
import pencilIcon from "../assets/icons/pencil-1.svg";
import plusIcon from "../assets/icons/plus.svg";
import trashIcon from "../assets/icons/trash-3.svg";

// Notification Toast Component
const NotificationToast = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 16px",
        background: "var(--cg-panel)",
        border: "2px solid var(--cg-primary)",
        borderRadius: "8px",
        boxShadow: "var(--cg-shadow)",
        color: "var(--cg-text)",
        fontSize: "0.9rem",
        fontWeight: "500",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        animation: "slideInUp 0.3s ease-out",
        maxWidth: "300px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--cg-primary)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <span>{message}</span>
    </div>
  );
};

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
    isRoot = false,
    canDelete = true,
    isCreatingBranch = false,
    isOnCooldown = false,
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
      {!isRoot && (
        <Handle type="target" position={Position.Top} id="top" style={{ background: "transparent" }} />
      )}

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
                disabled={isCreatingBranch || isOnCooldown}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: (isCreatingBranch || isOnCooldown) ? "not-allowed" : "pointer",
                  padding: "4px 6px",
                  fontSize: "14px",
                  opacity: (isCreatingBranch || isOnCooldown) ? 0.5 : 1,
                  transition: "opacity 0.2s ease",
                }}
                title={
                  isCreatingBranch 
                    ? "Creating branch..." 
                    : isOnCooldown 
                    ? "Please wait..." 
                    : "Create child chat"
                }
              >
                <img 
                  src={plusIcon} 
                  alt="Add" 
                  style={{ 
                    width: "16px", 
                    height: "16px",
                    filter: (isCreatingBranch || isOnCooldown) ? "grayscale(50%)" : "none",
                  }} 
                />
              </button>
              {canDelete && onDeleteClick && (
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
              )}
            </div>
          )}
          {canDelete && showDeleteConfirm && (
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
  
  // Notification and cooldown state
  const [notification, setNotification] = useState(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [lastCreateClick, setLastCreateClick] = useState(0);

  // Use ref to track hover timeout to prevent rapid state changes
  const hoverTimeoutRef = useRef(null);

  const nodeTypes = useMemo(
    () => ({
      chat: ChatNode,
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
      const res = await api.fetchWithAuth(supabase, `/chats/${editingChatId}`, {
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

        // If this is the root chat (no parent), also update the graph title
        if (!chat.parent_id && selectedGraph) {
          try {
            const graphRes = await api.fetchWithAuth(supabase, `/graphs/${selectedGraph.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: newValue.trim() }),
            });

            if (graphRes.ok) {
              const graphPayload = await graphRes.json();
              if (graphPayload?.graph && onGraphsUpdate) {
                onGraphsUpdate((prev) =>
                  prev.map((g) => (g.id === graphPayload.graph.id ? graphPayload.graph : g))
                );
              }
              if (graphPayload?.graph && setSelectedGraph) {
                setSelectedGraph(graphPayload.graph);
              }
              const rootChat = graphPayload?.rootChat;
              if (rootChat && onChatsUpdate) {
                onChatsUpdate((prev) =>
                  prev.map((c) => (c.id === rootChat.id ? rootChat : c))
                );
              }
              if (rootChat && selectedChat?.id === rootChat.id) {
                setSelectedChat(rootChat);
              }
              if (onGraphsRefresh) {
                onGraphsRefresh(true);
              }
            }
          } catch (err) {
            console.error("Failed to update graph title from root chat edit:", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to update chat title:", err);
    }

    setEditingChatId(null);
  }, [editingChatId, chats, supabase, onChatsUpdate, selectedChat, setSelectedChat, selectedGraph, onGraphsUpdate, setSelectedGraph, onGraphsRefresh]);

  const handleEditCancel = useCallback(() => {
    setEditingChatId(null);
  }, []);

  // Create child chat
  const handleCreateChild = useCallback(
    async (parentChatId) => {
      // Cooldown check - prevent clicks within 1.5 seconds of last click
      const COOLDOWN_MS = 1500;
      const now = Date.now();
      const timeSinceLastClick = now - lastCreateClick;
      
      if (timeSinceLastClick < COOLDOWN_MS || isCreatingBranch) {
        return; // Ignore click during cooldown or if already creating
      }

      if (!selectedGraph || !supabase) {
        console.error("Cannot create child: missing graph or supabase client");
        return;
      }

      // Update state
      setLastCreateClick(now);
      setIsCreatingBranch(true);
      
      // Show notification
      const parentChat = chats.find((c) => c.id === parentChatId);
      const chatTitle = parentChat?.title || "Chat";
      setNotification(`Creating branch from "${chatTitle}"...`);

      // Save current viewport to restore it after update
      const currentViewport = getViewport();

      try {
        const api = await import("../api");
        const title = `Branch from ${chatTitle}`;
        const res = await api.fetchWithAuth(supabase, "/chats", {
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
          
          // Hide notification after a short delay
          setTimeout(() => {
            setNotification(null);
          }, 1500);
        } else {
          // Error occurred
          setNotification("Failed to create branch. Please try again.");
          setTimeout(() => {
            setNotification(null);
          }, 3000);
        }
      } catch (err) {
        console.error("Failed to create child chat:", err);
        setNotification("Failed to create branch. Please try again.");
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } finally {
        setIsCreatingBranch(false);
      }
    },
    [selectedGraph, chats, supabase, onChatsUpdate, getViewport, setViewport, onGraphsRefresh, lastCreateClick, isCreatingBranch]
  );

  // Delete chat (cascading)
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmChatId) return;

    if (!supabase) {
      console.error("Supabase client not available for deletion");
    setDeleteConfirmChatId(null);
      return;
    }

    const chatToDelete = chats.find((c) => c.id === deleteConfirmChatId);
    if (!chatToDelete || !chatToDelete.parent_id) {
      // Prevent deleting the root chat
      setDeleteConfirmChatId(null);
      return;
    }

    try {
      const api = await import("../api");
      const res = await api.fetchWithAuth(supabase, `/chats/${deleteConfirmChatId}`, {
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
      calculateLayout(chat, 0);
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
      const isRootChat = chat.parent_id == null;
      const canDelete = !isRootChat;
      const showButtons = (isHovered || isSelected) && !deleteConfirmChatId && !isEditing;
      const showDeleteConfirm = canDelete && deleteConfirmChatId === chat.id;
      
      // Add cooldown/loading state
      const COOLDOWN_MS = 1500;
      const isOnCooldown = Date.now() - lastCreateClick < COOLDOWN_MS;
      
      const nodeBackground = isRootChat ? "var(--cg-node-root-bg)" : "var(--cg-node-chat-bg)";
      const nodeBorder = isRootChat ? "var(--cg-node-root-border)" : "var(--cg-node-chat-border)";

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
          onDeleteClick: canDelete ? () => setDeleteConfirmChatId(chat.id) : null,
          onDeleteConfirm: canDelete ? handleDeleteConfirm : null,
          onDeleteCancel: canDelete ? () => setDeleteConfirmChatId(null) : null,
          isRoot: isRootChat,
          canDelete,
          isCreatingBranch,
          isOnCooldown,
        },
        draggable: !isEditing && !showButtons && !showDeleteConfirm,
        style: {
          background: nodeBackground,
          border: `3px solid ${nodeBorder}`,
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

    // Build tree for each root chat
    rootChats.forEach((chat) => {
      buildNodesAndEdges(chat, null);
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
    setNodes,
    setEdges,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleCreateChild,
    handleDeleteConfirm,
    loading,
    isCreatingBranch,
    lastCreateClick,
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
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
            setHoveredChatId(node.data.chatId);
          }
        }}
        onNodeMouseLeave={(event, node) => {
          if (node.type === "chat") {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredChatId(null);
              hoverTimeoutRef.current = null;
            }, 100);
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
      
      {/* Notification toast */}
      <NotificationToast 
        message={notification} 
        visible={!!notification}
      />
    </div>
  );
}
