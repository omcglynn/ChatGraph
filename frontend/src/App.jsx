import logo  from './ChatGraphImage1.png'
import './App.css'
//(FIX CURRENT LINK FOR "Login" and "About" once we create those)

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to ChatGraph! Login or signup below. 
        </p>
        <p>
        Click "About" to learn more.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Login
        </a>
      <div>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </a>
      </div>
      </header>
    </div>
  );
}
export default App
