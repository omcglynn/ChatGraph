import React, { useState } from "react";
import Tree from "./Tree";
import "../App.css"; 
import ThemeToggle from "../components/ThemeToggle";
import "../styles/index.css";
import { ReactFlowProvider } from "@xyflow/react";

export default function Homepage({ user, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const chats = [
    {
      id: 1,
      title: "Easy and quick Italian cuisine recipes...",
      date: "9/22/2025",
      summary: [
        {
          text: "Pasta dishes",
          children: [
            {
              id: "1-0",
              title: "Spaghetti",
              summary: [
                { text: "Ingredients", children: [] },
                { text: "Cooking steps", children: [] },
              ],
              children: [],
            },
          ],
        },
        { text: "Tiramisu dessert", children: [] },
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

  const filteredChats = chats.filter((chat) => {
    const lowerSearch = searchTerm.toLowerCase();
    const inTitle = chat.title.toLowerCase().includes(lowerSearch);

    const inSummary = chat.summary?.some((s) => {
      if (typeof s === "string") return s.toLowerCase().includes(lowerSearch);
      if (s.text) return s.text.toLowerCase().includes(lowerSearch);
      return false;
    });

    return inTitle || inSummary;
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--cg-bg)" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="chat-list">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  selectedChat?.id === chat.id ? "active" : ""
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-title">{chat.title}</div>
                <div className="chat-date">{chat.date}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="start-chat-button"
          onClick={() => alert("Starting new chat...")}
        >
          💬 Start Chat
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
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
        

        <div className="tree-container">
          <ReactFlowProvider>
            <Tree
              user={user}
              chats={filteredChats}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
            />
          </ReactFlowProvider>
        </div>
      </main>
    </div>
  );
}
