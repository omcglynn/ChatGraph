import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

const tree = {
  id: 1,
  text: "Most common pets",
  children: [
    {
      id: 2,
      text: "Dog breeds",
      children: [
        { id: 3, text: "Golden retriever", children: [] },
        { id: 4, text: "Chocolate labrador", children: [] },
      ],
    },
    {
      id: 5,
      text: "Cat breeds",
      children: [],
    },
  ],
};


function App() {
  const [showPanel, setShowPanel] = useState(true);
  const [panelWidth, setPanelWidth] = useState(500); // start with 500px
  useEffect(() => {
    setPanelWidth(window.innerWidth * 0.5);
  }, []);

  function handleDrag(e) {
    const newWidth = e.clientX;
    const maxWidth = window.innerWidth - 200;
    setPanelWidth(Math.max(200, Math.min(newWidth, maxWidth)));
  }



  function TreeNode({ node }) {
    return (
      <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
        <div>{node.text}</div>
        {node.children.map(child => (
          <TreeNode key={child.id} node={child} />
        ))}
      </div>
    );
  }


    return (
    <div className="container">
      {showPanel && (
        <div
          className="panel"
          style={{ width: `${panelWidth}px` }}
        >
          <button onClick={() => setShowPanel(false)}>Hide Panel</button>
          {/* Tree will go here */}
          <TreeNode node={tree} />
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
      </div>
    </div>
  );

  
}




export default App
