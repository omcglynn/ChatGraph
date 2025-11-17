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
import "../components/tree.css";

export default function Tree({ user, chats, selectedChat, setSelectedChat }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const handleNodeClick = (event, node) => {
    if (node.type === "chat") {
      const chat = chats.find((c) => c.id === node.chatId);
      if (chat) setSelectedChat(chat);
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
    const nodesList = [];
    const edgesList = [];

    const buildTree = (chat, depth = 0, index = 0, parentId = null) => {
      const chatNodeId = `chat-${chat.id}`;
      const x = 350 + index * 250 - depth * 100;
      const y = depth * 200;

      nodesList.push({
        id: chatNodeId,
        type: "chat",
        chatId: chat.id,
        data: { label: chat.title },
        position: { x, y },
        style: {
          background: "#DBEAFE",
          border: "3px solid #2563eb",
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
        });
      }

      chat.summary?.forEach((item, i) => {
        const summaryId = `${chatNodeId}-summary-${i}`;
        const hasChildren = item.children && item.children.length > 0;

        nodesList.push({
          id: summaryId,
          type: "summary",
          summaryIndex: i,
          data: { label: typeof item === "string" ? item : item.text },
          position: {
            x: x + i * 180 - (chat.summary.length - 1) * 90,
            y: y + 150,
          },
          style: {
            background: "#93c5fd",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            padding: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            textAlign: "center",
            cursor: hasChildren ? "pointer" : "default",
          },
          children: hasChildren ? item.children : [],
        });

        edgesList.push({
          id: `edge-${chatNodeId}-${summaryId}`,
          source: chatNodeId,
          target: summaryId,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        });
      });

      chat.children?.forEach((child, childIndex) => {
        buildTree(child, depth + 1, childIndex, chatNodeId);
      });
    };

    if (selectedChat) {
      buildTree(selectedChat);
    } else {
      const rootId = "root";
      nodesList.push({
        id: rootId,
        type: "input",
        data: { label: user?.email || "All Chats" },
        position: { x: 350, y: 0 },
        style: {
          background: "#EFF6FF",
          border: "2px solid #3b82f6",
          borderRadius: "10px",
          padding: "10px",
          fontWeight: "bold",
        },
      });

      chats.forEach((chat, i) => {
        const chatId = `chat-${chat.id}`;
        nodesList.push({
          id: chatId,
          type: "chat",
          chatId: chat.id,
          data: { label: chat.title },
          position: { x: i * 250, y: 200 },
          style: {
            background: chat.id % 2 === 0 ? "#ADD8E6" : "#FFDAB9",
            border: "2px solid #000",
            borderRadius: "10px",
            padding: "10px",
            cursor: "pointer",
          },
        });

        edgesList.push({
          id: `edge-${rootId}-${chatId}`,
          source: rootId,
          target: chatId,
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        });
      });
    }

    setNodes(nodesList);
    setEdges(edgesList);
  }, [selectedChat, user, chats]);

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
