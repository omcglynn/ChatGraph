export default function ChatCard({ chat, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-blue-50 cursor-pointer transition hover:scale-[1.01]"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800 text-base leading-snug line-clamp-2">
          {chat.title}
        </h3>
        <span className="text-xs text-gray-400 whitespace-nowrap">{chat.date}</span>
      </div>
      <ul className="text-sm text-gray-600 space-y-1 mt-2 list-disc list-inside">
        {chat.summary.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
