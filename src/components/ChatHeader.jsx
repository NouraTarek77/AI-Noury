import "./ChatHeader.css";
function ChatHeader({
  darkMode,
  setDarkMode,
  setSidebarOpen,
}) {
  return (
    <header className="chat-header">

      {/* Mobile Menu */}
      <button
        className="menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        ☰
      </button>

      {/* AI Avatar */}
      <div className="ai-avatar">
        🤖
      </div>

      {/* Header Info */}
      <div className="header-info">
        <h1>AI Noury</h1>

        <div className="online-status">
          <span className="online-dot"></span>
          Online
        </div>
      </div>

      {/* Theme Button */}
      <button
        className="theme-btn"
        onClick={() => setDarkMode(!darkMode)}
        aria-label="Toggle dark mode"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

    </header>
  );
}

export default ChatHeader;