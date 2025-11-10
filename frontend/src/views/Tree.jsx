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
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Simple node renderers must be defined outside the component (or memoized) to avoid React Flow warnings
const ChatNode = ({ data }) => (
  <div style={{ position: 'relative', padding: 8, fontWeight: 700, color: 'var(--cg-text)', minWidth: 120, textAlign: 'center' }}>
    <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent' }} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'transparent' }} />
  </div>
);

const SummaryNode = ({ data }) => (
  <div style={{ position: 'relative', padding: 6, fontSize: 12, color: 'var(--cg-text-muted)', minWidth: 100, textAlign: 'center' }}>
    <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent' }} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'transparent' }} />
  </div>
);

const nodeTypes = { chat: ChatNode, summary: SummaryNode };

export default function Tree({ user, chats, selectedChat, setSelectedChat, setShowChat, selectedGraph }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const handleNodeClick = (event, node) => {
  if (node.type === "chat") {
      const chat = chats.find((c) => c.id === node.chatId);
      if (chat) {
        setSelectedChat(chat);
        setShowChat && setShowChat(true);
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
        setShowChat && setShowChat(true);
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
          background: "var(--cg-node-chat-bg)",
          border: "3px solid var(--cg-node-chat-border)",
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
            background: "var(--cg-node-summary-bg)",
            border: "2px solid var(--cg-node-summary-border)",
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
      // When a graph is selected, show that graph as the root node; otherwise don't show an account-level root
      const filteredChats = (chats || []).filter((c) => c && c.graph_id != null);

      if (selectedGraph) {
        const rootId = `root-${selectedGraph.id}`;
        nodesList.push({
          id: rootId,
          type: "input",
          data: { label: selectedGraph.title || "Graph" },
          position: { x: 350, y: 0 },
          style: {
            background: "var(--cg-node-root-bg)",
            border: "2px solid var(--cg-node-root-border)",
            borderRadius: "10px",
            padding: "10px",
            fontWeight: "bold",
          },
        });

        filteredChats.forEach((chat, i) => {
          const chatId = `chat-${chat.id}`;
          nodesList.push({
            id: chatId,
            type: "chat",
            chatId: chat.id,
            data: { label: chat.title },
            position: { x: i * 250, y: 200 },
            style: {
              background: chat.id % 2 === 0 ? "var(--cg-node-chat-alt-bg)" : "var(--cg-node-chat-bg)",
              border: "2px solid var(--cg-node-chat-border)",
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
      } else {
        // No graph selected: show chats without an account-level root. Also filter out any account-wide/full-graph chats (graph_id == null)
        filteredChats.forEach((chat, i) => {
          const chatId = `chat-${chat.id}`;
          nodesList.push({
            id: chatId,
            type: "chat",
            chatId: chat.id,
            data: { label: chat.title },
            position: { x: i * 250, y: 200 },
            style: {
              background: chat.id % 2 === 0 ? "var(--cg-node-chat-alt-bg)" : "var(--cg-node-chat-bg)",
              border: "2px solid var(--cg-node-chat-border)",
              borderRadius: "10px",
              padding: "10px",
              cursor: "pointer",
            },
          });
        });
      }
    }

    setNodes(nodesList);
    setEdges(edgesList);
  }, [selectedChat, user, chats, selectedGraph, setNodes, setEdges]);

  useEffect(() => {
    if (!selectedChat) return;
    setCenter(350, 200, { zoom: 1.4, duration: 800 });
  }, [selectedChat, setCenter]);

  // When a graph is selected (and no chat), center the view on the graph root
  useEffect(() => {
    if (!selectedGraph) return;
    setCenter(350, 120, { zoom: 1.0, duration: 600 });
  }, [selectedGraph, setCenter]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Compute minimap colors from CSS tokens so minimap respects theme (dark/light)
  const minimapColors = React.useMemo(() => {
    try {
      const s = getComputedStyle(document.documentElement);
      const nodeColor = s.getPropertyValue('--cg-node-chat-bg')?.trim() || '#93c5fd';
      const nodeStroke = s.getPropertyValue('--cg-node-chat-border')?.trim() || '#3b82f6';
      const mask = s.getPropertyValue('--cg-panel')?.trim() || '#ffffff';
      return { nodeColor, nodeStroke, mask };
    } catch {
      return { nodeColor: '#93c5fd', nodeStroke: '#3b82f6', mask: '#ffffff' };
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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