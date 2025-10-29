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

export default function Tree({ user, selectedChat }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const chats = [
    {
      id: 1,
      title: "Easy and quick Italian cuisine recipes...",
      date: "9/22/2025",
      summary: [
        "Try our 15-min pasta recipes",
        "Learn to make tiramisu like a pro",
        "Discover authentic Italian sauces",
      ],
    },
    {
      id: 2,
      title: "Is mitochondria the powerhouse of the cell?",
      date: "9/18/2025",
      summary: [
        "Discussing cell biology basics",
        "Why mitochondria matters",
        "Exploring bioenergy processes",
      ],
    },
    {
      id: 3,
      title: "5-Minute Breakfasts for Busy Mornings",
      date: "9/1/2025",
      summary: [
        "Overnight oats variations",
        "Microwave egg muffins",
        "Smoothies with hidden veggies",
      ],
    },
    {
      id: 4,
      title: "Best Boston Sports Players",
      date: "8/29/2025",
      summary: ["David Ortiz", "Bobby Orr", "Tom Brady", "Larry Bird"],
    },
    {
      id: 5,
      title: "Where in Cape Cod is the best to vacation in?",
      date: "8/16/2025",
      summary: ["Falmouth", "Martha's Vineyard", "Dennis", "Mashpee", "Nantucket"],
    },
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

    const chatNodes = [];
    const summaryNodes = [];
    const edgesList = [];

    chats.forEach((chat, i) => {
      const chatNode = {
        id: `chat-${chat.id}`,
        data: { label: chat.title },
        position: { x: i * 250, y: 200 },
        style: {
          background: selectedChat?.id === chat.id ? "#DBEAFE" : "#fff",
          border: selectedChat?.id === chat.id ? "3px solid #2563eb" : "2px solid #93c5fd",
          borderRadius: "10px",
          padding: "10px",
          textAlign: "center",
          cursor: "pointer",
        },
      };
      chatNodes.push(chatNode);
      edgesList.push({
        id: `e-root-${chat.id}`,
        source: "root",
        target: `chat-${chat.id}`,
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
      });

      if (selectedChat?.id === chat.id) {
        chat.summary.forEach((summaryItem, j) => {
          const summaryNode = {
            id: `chat-${chat.id}-summary-${j}`,
            data: { label: summaryItem },
            position: { x: i * 250 + j * 200 - (chat.summary.length - 1) * 100, y: 400 },
            style: {
              background: "#fef9c3",
              border: "2px solid #facc15",
              borderRadius: "8px",
              padding: "8px",
              fontSize: "12px",
              textAlign: "center",
            },
          };
          summaryNodes.push(summaryNode);
        
          edgesList.push({
            id: `e-chat-${chat.id}-${j}`,
            source: `chat-${chat.id}`,
            target: `chat-${chat.id}-summary-${j}`,
            animated: false,
            style: { stroke: "#facc15", strokeWidth: 2 },
          });
        });        
      }
    });

    setNodes([rootNode, ...chatNodes, ...summaryNodes]);
    setEdges(edgesList);
  }, [selectedChat, user]);

  useEffect(() => {
    if (!selectedChat) return;
    const index = chats.findIndex((c) => c.id === selectedChat.id);
    if (index !== -1) {
      const x = index * 250;
      const y = 200;
      setCenter(x, y, { zoom: 1.5, duration: 800 });
    }
  }, [selectedChat, setCenter]);

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
