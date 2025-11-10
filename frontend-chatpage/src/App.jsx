import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import TreeFlow from './TreeFlow';
import { useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];



function App() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [currentNodeId, setCurrentNodeId] = useState("n1"); 

  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

    const onNodesChange = useCallback(
    (changes) => setNodes((ns) => applyNodeChanges(changes, ns)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((es) => applyEdgeChanges(changes, es)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((es) => addEdge(params, es)),
    []
  );


  const [showPanel, setShowPanel] = useState(true);
  const [panelWidth, setPanelWidth] = useState(500); 
  const [messages, setMessages] = useState([
    { sender: 'User', text: 'Hello, AI!', nodeID: "n1"},
    { sender: 'AI', text: 'Hello! How can I assist you today?', nodeID: "n1"},
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setPanelWidth(window.innerWidth * 0.5);
  }, []);

  function handleDrag(e) {
    const newWidth = e.clientX;
    const maxWidth = window.innerWidth - 200;
    setPanelWidth(Math.max(200, Math.min(newWidth, maxWidth)));
  }

  function handleSendMessage() {
    if (input.trim() === '') return;
    const newMessages = [...messages, { sender: 'User', text: input , nodeId: currentNodeId}, ];
    setMessages(newMessages);
    setInput('');

    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'AI', text: 'This is a placeholder response.', nodeId: currentNodeId},
      ]);
    }, 1000);
  }

const handleEditMessage = (parentId, newText) => {
  const parentNode = nodes.find((n) => n.id == parentId);
  if (!parentNode) {
    console.warn(`Parent node ${parentId} not found`);
    return;
  }

  const newId = `n${Date.now()}`;

  console.log('Creating node from parent:', parentId);
  console.log('New node ID:', newId);


  const newNode = {
    id: newId,
    position: {
      x: parentNode.position.x + 200,
      y: parentNode.position.y + 100
    },
    data: { label: newText },
    parentId: parentId
  };

  const newEdge = {
    id: `${parentId}-${newId}`,
    source: parentId,
    target: newId
  };

  setNodes((prev) => [...prev, newNode]);
  setEdges((prev) => [...prev, newEdge]);
  setCurrentNodeId(newId); 
};

  return (
    <div className="container">
      {showPanel && (
        <div
          className="panel"
          style={{ width: `${panelWidth}px` }}
        >
          <button onClick={() => setShowPanel(false)}>Hide Panel</button>
          { <TreeFlow 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            currentNodeId={currentNodeId}
            setCurrentNodeId={setCurrentNodeId}
        />}
        </div>
      )}

      {showPanel && (
        <div className="divider"
          onMouseDown={() => {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', () => {
              window.removeEventListener('mousemove', handleDrag);
            }, { once: true });
          }}
        ></div>
      )}

      <div className="main">
        {!showPanel && (
          <button onClick={() => setShowPanel(true)}>Show Panel</button>
        )}
        <h1>Chat Placeholder</h1>
        <div className="chat-box">
          <div className="messages">
            {messages.map((msg, index) => (
  <div
    key={index}
    className={`message ${msg.sender.toLowerCase()}`}
    onMouseEnter={() => setHoveredIndex(index)}
    onMouseLeave={() => setHoveredIndex(null)}
  >
    <strong>{msg.sender}:</strong>{' '}
    {editingIndex === index ? (
      <>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
        />
        <button
          onClick={() => {
              const originalMessage = messages[index];
              const newMessage = {
                sender: originalMessage.sender,
                text: editText,
                nodeId: currentNodeId 
              };
              handleEditMessage(originalMessage.nodeId, editText);

              setMessages((prev) => [...prev, newMessage]);

              setEditingIndex(null);
              setEditText('');
          }}
        >
          Save
        </button>
        <button
          onClick={() => {
            setEditingIndex(null);
            setEditText('');
          }}
        >
          Cancel
        </button>
      </>
    ) : (
      <>
        {msg.text}
        {hoveredIndex === index && msg.sender === 'User' && (
          <button
            className="edit-button"
            onClick={() => {
              setEditingIndex(index);
              setEditText(msg.text);
            }}
          >
            Edit
          </button>
        )}
      </>
    )}
  </div>
))}
          </div>
          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
