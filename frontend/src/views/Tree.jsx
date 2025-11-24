import React, { useEffect, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "../styles/components/tree.css";

export default function Tree({ user, chats, selectedChat, setSelectedChat, setShowChat, selectedGraph, loading }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const handleNodeClick = (event, node) => {
    // Check both node.chatId (direct property) and node.data.chatId (in data)
    const chatId = node.chatId || node.data?.chatId;
    if (chatId) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        if (setShowChat) {
          setShowChat(true);
        }
      }
      return;
    }

    if (node.type === "summary") {
      if (node.children && node.children.length > 0) {
        setSelectedChat({
          id: node.id,
          title: node.data.label,
          summary: node.children.map((c) => c.title),
          children: node.children,
        });
      }
    }
  };

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

    // Build a map of chats by ID with children arrays
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

    // Simple layout function
    const buildTree = (chat, depth = 0, index = 0, parentId = null) => {
      const chatNodeId = `chat-${chat.id}`;
      const x = 350 + index * 250 - depth * 100;
      const y = depth * 200;

      nodesList.push({
        id: chatNodeId,
        type: "default",
        chatId: chat.id,
        data: { label: chat.title },
        position: { x, y },
        style: {
          background: chat.parent_id == null ? "#DBEAFE" : "#E0E7FF",
          border: chat.parent_id == null ? "3px solid #2563eb" : "2px solid #6366f1",
          color: "#1b2e59ff",
          borderRadius: "10px",
          padding: "10px",
          fontWeight: "bold",
          textAlign: "center",
        },
      });

      if (parentId) {
        edgesList.push({
          id: `edge-${parentId}-${chatNodeId}`,
          source: parentId,
          target: chatNodeId,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          animated: true,
        });
      }

      // Recursively build children
      const children = chat.children || [];
      children.forEach((child, childIndex) => {
        buildTree(child, depth + 1, childIndex, chatNodeId);
      });
    };

    // Build tree for each root chat
    rootChats.forEach((rootChat, index) => {
      buildTree(rootChat, 0, index, null);
    });

    setNodes(nodesList);
    setEdges(edgesList);
  }, [selectedGraph, chats, loading]);

  useEffect(() => {
    if (!selectedChat) return;
    setCenter(350, 200, { zoom: 1.4, duration: 800 });
  }, [selectedChat, setCenter]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  return (
    <div className="tree-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
