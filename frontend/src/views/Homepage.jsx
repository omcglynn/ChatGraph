import React, { useState } from "react";
import Tree from "./Tree"; 
import "../App.css"; 
import { ReactFlowProvider } from "@xyflow/react";

export default function Homepage({ user, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);

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

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb" }}>
      {/* Sidebar */}
<aside
  style={{
    width: "280px",
    background: "#e0e7ff",
    padding: "20px",
    borderRight: "1px solid #c7d2fe",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // pushes button to bottom
    height: "100vh",
  }}
>
  {/* Top section: search + chats */}
  <div style={{ overflowY: "auto", flexGrow: 1 }}>
    <div style={{ marginBottom: "10px" }}>
      <input
        type="text"
        placeholder="Search chats..."
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
        }}
      />
    </div>

    {chats.map((chat) => (
      <div
        key={chat.id}
        onClick={() => setSelectedChat(chat)}
        style={{
          padding: "10px",
          marginBottom: "8px",
          borderRadius: "10px",
          background: selectedChat?.id === chat.id ? "#3b82f6" : "#ffffff",
          color: selectedChat?.id === chat.id ? "#fff" : "#111827",
          fontWeight: selectedChat?.id === chat.id ? "600" : "500",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          boxShadow:
            selectedChat?.id === chat.id
              ? "0 0 6px rgba(59,130,246,0.5)"
              : "0 0 2px rgba(0,0,0,0.1)",
        }}
      >
        {chat.title}
        <div
          style={{
            fontSize: "0.8rem",
            color: selectedChat?.id === chat.id ? "#dbeafe" : "#6b7280",
          }}
        >
          {chat.date}
        </div>
      </div>
    ))}
  </div>

  {/* Bottom section: Start Chat button */}
  <button
    onClick={() => alert("Starting new chat...")}
    style={{
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.2s",
      marginTop: "10px",
    }}
    onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
    onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
  >
    💬 Start Chat
  </button>
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

        {/* Tree visualization section */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
            height: "80vh", 
          }}
        >
          <ReactFlowProvider>
            <Tree user={user} selectedChat={selectedChat} />
          </ReactFlowProvider>
        </div>
      </main>
    </div>
  );
}
