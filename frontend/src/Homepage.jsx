import React, { useState } from "react";
import ChatCard from "./ChatCard";

export default function Homepage({ supabase, user, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);

  const chats = [
    {
      id: 1,
      title: "Easy and quick Italian cuisine recipes...",
      date: "9/28/2025",
      summary: [
        "Try our 15-min pasta recipes",
        "Learn to make tiramisu like a pro",
        "Discover authentic Italian sauces",
      ],
    },
    {
      id: 2,
      title: "Is mitochondria the powerhouse of the cell?",
      date: "9/22/2025",
      summary: [
        "Discussing cell biology basics",
        "Why mitochondria matters",
        "Exploring bioenergy processes",
      ],
    },
    {
      id: 3,
      title: "5-Minute Breakfasts for Busy Mornings",
      date: "10/1/2025",
      summary: [
        "Overnight oats variations",
        "Microwave egg muffins",
        "Smoothies with hidden veggies",
      ],
    },
    {
      id: 4,
      title: "Do black holes really evaporate?",
      date: "10/3/2025",
      summary: [
        "Understanding Hawking radiation",
        "Thermodynamics of space-time",
        "What happens at the event horizon?",
      ],
    },
    {
      id: 5,
      title: "Designing logos with geometric precision",
      date: "10/5/2025",
      summary: [
        "Golden ratio in branding",
        "Color theory for impact",
        "Tools for vector perfection",
      ],
    },
    {
      id: 6,
      title: "Why prime numbers are the backbone of encryption",
      date: "10/7/2025",
      summary: [
        "RSA and modular arithmetic",
        "Generating large primes",
        "Factoring and computational hardness",
      ],
    },
    {
      id: 7,
      title: "Building your own retro game emulator",
      date: "10/9/2025",
      summary: [
        "CPU instruction decoding basics",
        "Memory mapping strategies",
        "Rendering sprites with SDL",
      ],
    },
    {
      id: 8,
      title: "Graph theory in real-world logistics",
      date: "10/11/2025",
      summary: [
        "Shortest path algorithms",
        "Strongly connected components",
        "Optimizing delivery routes",
      ],
    },
    {
      id: 9,
      title: "Stable matching: beyond dating apps",
      date: "10/13/2025",
      summary: [
        "Gale-Shapley algorithm explained",
        "Blocking pairs and optimality",
        "Applications in school admissions",
      ],
    },
    {
      id: 10,
      title: "Unrolling recurrence relations like a pro",
      date: "10/15/2025",
      summary: [
        "Recognizing patterns in T(n)",
        "Master theorem vs iteration",
        "Complexity classification tips",
      ],
    },
  ];
  

  return (
    <div className="w-screen h-screen flex bg-gray-100 text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 max-w-sm bg-white border-r flex flex-col shadow-md">
        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              onClick={() => setSelectedChat(chat)}
            />
          ))}
        </div>
      </div>

      {/* Main Chat Display */}
      <div className="flex-1 p-8 flex flex-col bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Welcome, {user?.email || "User"}
          </h2>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 transition text-white rounded-lg shadow"
          >
            Logout
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedChat ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedChat.title}
              </h3>
              <p className="text-sm text-gray-400">{selectedChat.date}</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                {selectedChat.summary.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
              <p className="text-lg font-medium">Select a chat to view details</p>
              <p className="text-sm text-gray-400 mt-2">
                Your past conversations will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
