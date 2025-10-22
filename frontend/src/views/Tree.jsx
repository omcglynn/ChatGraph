
import React, { useEffect, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  MiniMap,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

export default function Tree({ user, selectedChat }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const chats = [
    { id: "1", title: "Easy Italian Cuisine" },
    { id: "2", title: "Mitochondria Basics" },
    { id: "3", title: "Quick Breakfasts" },
    { id: "4", title: "Boston Sports" },
    { id: "5", title: "Cape Cod Vacations" },
  ];

  useEffect(() => {

    const rootNode = {
      id: "root",
      type: "input",
      data: { label: user?.email || "All Chats" },
      position: { x: 350, y: 0 },
      style: {
        background: "#EFF6FF",
        border: "2px solid #3b82f6",
        borderRadius: "10px",
        padding: "10px",
        fontWeight: "bold",
        textAlign: "center",
      },
    };

    // arrange chat nodes below in a row
    const chatNodes = chats.map((chat, i) => ({
      id: chat.id,
      data: { label: chat.title },
      position: { x: i * 220, y: 200 },
      style: {
        background: selectedChat?.id === chat.id ? "#DBEAFE" : "#fff",
        border: selectedChat?.id === chat.id ? "3px solid #2563eb" : "2px solid #93c5fd",
        borderRadius: "10px",
        padding: "10px",
        textAlign: "center",
        cursor: "pointer",
      },
    }));

    const chatEdges = chats.map((chat) => ({
      id: `e-root-${chat.id}`,
      source: "root",
      target: chat.id,
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
    }));

    setNodes([rootNode, ...chatNodes]);
    setEdges(chatEdges);
  }, [selectedChat, user]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <MiniMap />
        <Controls />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
    </div>
  );
}

