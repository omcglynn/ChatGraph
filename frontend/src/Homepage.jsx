import React from "react";

export default function Homepage({ supabase, user, onLogout }) {
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
  ];

  return (
    <div className="w-screen h-screen flex bg-gray-100 text-gray-800 overflow-hidden">
      {/* Left Sidebar */}
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
            <div
              key={chat.id}
              className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-blue-50 cursor-pointer transition"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-1">
                  {chat.title}
                </h3>
                <span className="text-xs text-gray-400">{chat.date}</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1 mt-2">
                {chat.summary.map((line, index) => (
                  <li key={index}>• {line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Display */}
      <div className="flex-1 p-8 flex flex-col bg-gray-50">
        {/* Header */}
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

        {/* Main Content Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
          <p className="text-lg font-medium">Select a chat to view details</p>
          <p className="text-sm text-gray-400 mt-2">
            Your past conversations will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
