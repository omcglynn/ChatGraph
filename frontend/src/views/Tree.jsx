import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Position,
  Handle,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import pencilIcon from "../assets/icons/pencil-1.svg";
import plusIcon from "../assets/icons/plus.svg";
import trashIcon from "../assets/icons/trash-3.svg";

const ChatNode = ({ data }) => {
  const {
    label,
    isEditing,
    initialValue,
    showButtons,
    showDelete,
    onEditStart,
    onEditSave,
    onEditCancel,
    onCreateChild,
    onDeleteClick,
    onDeleteConfirm,
    onDeleteCancel,
    isRoot,
    canDelete,
  } = data;

  const [value, setValue] = React.useState(initialValue || "");

  React.useEffect(() => {
    if (isEditing) setValue(initialValue || "");
  }, [isEditing, initialValue]);

  const save = () => onEditSave(value);

  return (
    <div
      style={{
        position: "relative",
        padding: 8,
        color: "var(--cg-text)",
        fontWeight: 700,
        textAlign: "center",
        minWidth: "100%",
      }}
      onMouseDown={(e) => {
        if (isEditing || showButtons || showDelete) e.stopPropagation();
      }}
    >
      {!isRoot && (
        <Handle type="target" position={Position.Top} style={{ background: "transparent" }} />
      )}

      {/* -------- Floating Toolbox Fix -------- */}
      {showButtons && (
        <div
          style={{
            position: "absolute",
            top: -40,
            right: "50%",
            transform: "translateX(50%)",
            display: "flex",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 6,
            background: "var(--cg-panel)",
            border: "1px solid var(--cg-border)",
            boxShadow: "var(--cg-shadow)",
            zIndex: 20,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <IconBtn icon={pencilIcon} onClick={onEditStart} />
          <IconBtn icon={plusIcon} onClick={onCreateChild} />
          {canDelete && <IconBtn icon={trashIcon} onClick={onDeleteClick} />}
        </div>
      )}
      {/* -------------------------------------- */}

      {isEditing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
            else if (e.key === "Escape") onEditCancel();
          }}
          autoFocus
          style={{
            width: "100%",
            padding: "4px 8px",
            border: "2px solid var(--cg-primary)",
            borderRadius: 4,
            background: "var(--cg-input-bg)",
            color: "var(--cg-text)",
            textAlign: "center",
          }}
        />
      ) : (
        <>
          <div style={{ wordWrap: "break-word", lineHeight: 1.3 }}>{label}</div>

          {/* Delete Confirmation Panel */}
          {showDelete && canDelete && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 6,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "0.85rem", marginBottom: 6 }}>
                Delete "{label}"? This removes all subchats.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={deleteBtn}
                  onClick={onDeleteConfirm}
                >
                  Delete
                </button>
                <button
                  style={cancelBtn}
                  onClick={onDeleteCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: "transparent" }} />
    </div>
  );
};

const IconBtn = ({ onClick, icon }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
  >
    <img src={icon} style={{ width: 16, height: 16 }} />
  </button>
);

const deleteBtn = {
  flex: 1,
  background: "#ef4444",
  color: "white",
  borderRadius: 4,
  padding: "4px 12px",
  border: "none",
  cursor: "pointer",
};

const cancelBtn = {
  flex: 1,
  background: "var(--cg-panel)",
  border: "1px solid var(--cg-border)",
  padding: "4px 12px",
  borderRadius: 4,
  cursor: "pointer",
};

const CONFIG = {
  NODE_W: 200,
  NODE_W_EXP: 280,
  NODE_H: 80,
  GAP_X: 80,
  GAP_Y: 140,
  ROOT_Y: 50,
};

// ------------------------------
// LAYOUT
// ------------------------------
function computeLayout(chat, depth = 0) {
  const children = chat.children || [];
  const isExpanded = chat._showDelete;
  const width = isExpanded ? CONFIG.NODE_W_EXP : CONFIG.NODE_W;

  if (children.length === 0) {
    chat._layout = { width, nodeW: width, depth };
    return width;
  }

  let total = 0;
  children.forEach((c) => (total += computeLayout(c, depth + 1)));
  total += (children.length - 1) * CONFIG.GAP_X;

  const finalW = Math.max(total, width);
  chat._layout = { width: finalW, nodeW: width, depth };
  return finalW;
}

function assignPositions(chat, startX) {
  const L = chat._layout;
  L.x = startX + L.width / 2 - L.nodeW / 2;
  L.y = CONFIG.ROOT_Y + L.depth * CONFIG.GAP_Y;

  let cx = startX;
  chat.children?.forEach((child) => {
    assignPositions(child, cx);
    cx += child._layout.width + CONFIG.GAP_X;
  });
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function Tree(props) {
  const {
    chats,
    selectedChat,
    setSelectedChat,
    setShowChat,
    selectedGraph,
    loading,
    supabase,
    onChatsUpdate,
  } = props;

  const [editingId, setEditing] = useState(null);
  const [hoverId, setHover] = useState(null);
  const [deleteId, setDelete] = useState(null);

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ chat: ChatNode }), []);

  // Build hierarchical tree
  const roots = useMemo(() => {
    if (!selectedGraph || !chats) return [];

    const filtered = chats.filter((c) => c.graph_id === selectedGraph.id);
    const byId = new Map();

    filtered.forEach((c) => byId.set(c.id, { ...c, children: [], _layout: {} }));

    const rootList = [];
    byId.forEach((chat) => {
      if (chat.parent_id && byId.has(chat.parent_id)) {
        byId.get(chat.parent_id).children.push(chat);
      } else {
        rootList.push(chat);
      }
    });

    return rootList;
  }, [chats, selectedGraph]);

  useEffect(() => {
    if (!roots.length || loading) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rootsCopy = JSON.parse(JSON.stringify(roots));

    rootsCopy.forEach((root) => {
      computeLayout(root);
    });

    let totalWidth = 0;
    rootsCopy.forEach((root) => (totalWidth += root._layout.width));
    if (rootsCopy.length > 1) totalWidth += (rootsCopy.length - 1) * CONFIG.GAP_X;

    const startX = -totalWidth / 2;
    let cursorX = startX;

    rootsCopy.forEach((root) => {
      assignPositions(root, cursorX);
      cursorX += root._layout.width + CONFIG.GAP_X;
    });

    const newNodes = [];
    const newEdges = [];

    const build = (chat, parentId = null) => {
      const id = `chat-${chat.id}`;

      const isEditing = editingId === chat.id;
      const isHovered = hoverId === chat.id;
      const isRoot = chat.parent_id == null;
      const canDelete = !isRoot;
      const showDelete = deleteId === chat.id;
      const showButtons = !isEditing && !showDelete && (isHovered || selectedChat?.id === chat.id);

      chat._showDelete = showDelete;

      newNodes.push({
        id,
        type: "chat",
        position: { x: chat._layout.x, y: chat._layout.y },
        data: {
          chatId: chat.id,        
          label: chat.title,
          initialValue: chat.title,
          isEditing,
          showButtons,
          showDelete,
          isRoot,
          canDelete,
          onEditStart: () => setEditing(chat.id),
          onEditSave: (v) => saveEdit(chat.id, v),
          onEditCancel: () => setEditing(null),
          onCreateChild: () => createChild(chat.id),
          onDeleteClick: canDelete ? () => setDelete(chat.id) : null,
          onDeleteConfirm: canDelete ? () => confirmDelete(chat.id) : null,
          onDeleteCancel: () => setDelete(null),
        },
        draggable: false,
        style: {
          background: isRoot ? "var(--cg-node-root-bg)" : "var(--cg-node-chat-bg)",
          border: `3px solid ${isRoot ? "var(--cg-node-root-border)" : "var(--cg-node-chat-border)"}`,
          borderRadius: 10,
          padding: 10,
          cursor: showButtons || showDelete || isEditing ? "default" : "move",
          width: showDelete ? CONFIG.NODE_W_EXP : CONFIG.NODE_W,
          minHeight: CONFIG.NODE_H,
        },
      });

      if (parentId) {
        newEdges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          animated: true,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          animated: true,
        });
      }

      chat.children.forEach((child) => build(child, id));
    };

    rootsCopy.forEach((root) => build(root));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [roots, editingId, hoverId, deleteId, selectedChat, loading]);


  const saveEdit = async (id, value) => {
    if (!value.trim() || !supabase) {
      setEditing(null);
      return;
    }
    const api = await import("../api");
    await api.fetchWithAuth(supabase, `/api/chats/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value.trim() }),
    });

    onChatsUpdate((prev) => prev.map((c) => (c.id === id ? { ...c, title: value } : c)));
    setEditing(null);
  };


  const createChild = async (parentId) => {
    if (!supabase || !selectedGraph) return;
    const api = await import("../api");
    const parent = chats.find((c) => c.id === parentId);
    const title = `Branch from ${parent?.title || "Chat"}`;

    const res = await api.fetchWithAuth(supabase, "/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graphId: selectedGraph.id, title, parentId }),
    });

    const payload = await res.json();
    onChatsUpdate((prev) => [payload.chat, ...prev]);
  };


  const confirmDelete = async (id) => {
    if (!supabase) return;
    const api = await import("../api");

    await api.fetchWithAuth(supabase, `/api/chats/${id}`, { method: "DELETE" });

    const getDesc = (id) => {
      const res = [];
      const walk = (pid) => {
        chats.forEach((c) => {
          if (c.parent_id === pid) {
            res.push(c.id);
            walk(c.id);
          }
        });
      };
      walk(id);
      return res;
    };

    const toRemove = [id, ...getDesc(id)];
    onChatsUpdate((prev) => prev.filter((c) => !toRemove.includes(c.id)));

    if (selectedChat && toRemove.includes(selectedChat.id)) {
      setSelectedChat(null);
      setShowChat(false);
    }

    setDelete(null);
  };


  const handleNodeClick = useCallback(
    (_, node) => {
      if (editingId || deleteId) return;

      const chatId = node.data.chatId;  // ← FIXED
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;

      setSelectedChat(chat);
      setShowChat(true);
    },
    [editingId, deleteId, chats, setSelectedChat, setShowChat]
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(_, node) => {
          const id = Number(node.id.replace("chat-", ""));
          setHover(id);
        }}
        onNodeMouseLeave={() => setHover(null)}
      >
        <MiniMap />
        <Controls />
        <Background gap={20} />
      </ReactFlow>
    </div>
  );
}
