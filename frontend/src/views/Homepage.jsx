import React, { useState } from "react";
import Tree from "./Tree"; 
import Chat from "./Chat"; 
import NewChat from "./newChat";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/index.css";
import { ReactFlowProvider } from "@xyflow/react";

export default function Homepage({ user, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(true);
  const [showChat, setShowChat] = useState(false);
  
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
        {
          text: "Tiramisu dessert",
          children: [],
        },
      ]
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


  
  // Filter chats based on search term (title + summary)
  const filteredChats = chats.filter((chat) => {
    const lowerSearch = searchTerm.toLowerCase();
    const inTitle = chat.title.toLowerCase().includes(lowerSearch);

    const inSummary = chat.summary?.some((s) => {
      if (typeof s === "string") {
        return s.toLowerCase().includes(lowerSearch);
      } else if (s.text) {
        return s.text.toLowerCase().includes(lowerSearch);
      }
      return false;
    });

    return inTitle || inSummary;
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--cg-bg)" }}>
      <aside className="sidebar">
        <div style={{ overflowY: "auto", flexGrow: 1 }}>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="chat-list">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { setSelectedChat(chat); setShowNewChat(false); setShowChat(false); }}
                className={`chat-item ${selectedChat?.id === chat.id ? "selected" : ""}`}
              >
                {chat.title}
                <div className="chat-date">{chat.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-area">
          <button
            onClick={() => { setShowNewChat(true); setSelectedChat(null); setShowChat(false); }}
            className="start-chat"
          >
            💬 Start Chat
          </button>
        </div>
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

        {/* If a chat is selected, show the Chat view; otherwise show Tree */}
        <div
          style={{
            background: "var(--cg-panel)",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "var(--cg-shadow)",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {showNewChat && !selectedChat ? (
            <NewChat onCreate={(c) => {
              console.log("new chat created:", c);
            }} />
          ) : selectedChat ? (
            showChat ? (
              // Show the chat conversation pane when showChat is true
              <Chat
                selectedChat={selectedChat}
                onClose={() => setShowChat(false)}
              />
            ) : (
              // Otherwise show the tree for the selected chat
              <ReactFlowProvider>
                <Tree
                  user={user}
                  chats={[selectedChat]} // pass only the selected chat so Tree builds that tree only
                  selectedChat={selectedChat}
                  setSelectedChat={setSelectedChat}
                  setShowChat={setShowChat} // <-- pass the setter so Tree can open Chat
                />
              </ReactFlowProvider>
            )
          ) : (
            <NewChat />
          )}
        </div>
      </main>
    </div>
  );
}
