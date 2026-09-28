import { useState } from "react";
import "./Sidebar.css";

function Sidebar({
  onNewChat,
  chats,
  onOpenChat,
  onDeleteChat,
  onClearChats,
  sidebarOpen,
  setSidebarOpen,
  currentChatId,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>

        <button
          className="new-chat-btn"
          onClick={() => {
            onNewChat();
            setSidebarOpen(false);
          }}
        >
          <span className="new-chat-icon">+</span>

          <span>
            New Chat
          </span>
        </button>

        <div className="chat-history">
          <p className="history-title">
            Recent Chats
          </p>

          <div className="chat-search">
            <span className="chat-search-icon">
              🔎
            </span>

            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          {chats.length === 0 ? (
            <div className="empty-history">
              <div className="empty-history-icon">
                💬
              </div>

              <p>
                No previous chats
              </p>

              <small>
                Start a new conversation
              </small>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="empty-history">
              <div className="empty-history-icon">
                🔎
              </div>

              <p>
                No chats found
              </p>

              <small>
                Try another search
              </small>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`history-item ${
                  chat.id === currentChatId
                    ? "active-chat"
                    : ""
                }`}
              >
                <button
                  className="chat-open-btn"
                  onClick={() => {
                    onOpenChat(chat);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="chat-icon">
                    💬
                  </span>

                  <span className="chat-title">
                    {chat.title.length > 25
                      ? chat.title.slice(0, 25) + "..."
                      : chat.title}
                  </span>
                </button>

                <button
                  className="delete-chat-btn"
                  onClick={() =>
                    onDeleteChat(chat.id)
                  }
                  aria-label="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {chats.length > 0 && (
          <button
            className="clear-btn"
            onClick={onClearChats}
          >
            🧹

            <span>
              Clear All Chats
            </span>
          </button>
        )}
      </aside>
    </>
  );
}

export default Sidebar;

