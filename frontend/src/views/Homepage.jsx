import React, { useState } from "react";
import "../App.css";

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
      summary: [
        "David Ortiz..",
        "Bobby Orr..",
        "Tom Brady..",
        "Larry Bird.."
      ],
    },
    {
      id: 6,
      title: "Where in Cape Cod is the best to vacation in?",
      date: "8/16/2025",
      summary: [
        "Falmouth",
        "Martha's Vineyard",
        "Dennis",
        "Mashpee",
        "Nantucket"
      ],
    },
  ];

  return (
    <div className="container">
      {/* Side coolumn for selecting chats */}
      <aside className="sidebar">
        <div className="search">
          <input type="text" placeholder="Search chats..." />
        </div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? "selected" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <strong>{chat.title}</strong>
              <div style={{ fontSize: "0.8rem", color: "#ccc" }}>{chat.date}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main column with selected chat */}
      <main className="main">
        <div className="main-header">
          <h2>Welcome, {user?.email || "User"}</h2>
          <button onClick={onLogout}>Logout</button>
        </div>

        <div className="main-content">
          {selectedChat ? (
            <div>
              <h3>{selectedChat.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#ddd" }}>{selectedChat.date}</p>
              <ul>
                {selectedChat.summary.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Select a chat to view details</p>
          )}
        </div>
      </main>
    </div>
  );
}
