import { useEffect, useRef, useState } from "react";
import ChatHeader from "./components/ChatHeader";
import Message from "./components/Message";
import ChatInput from "./components/ChatInput";
import Sidebar from "./components/Sidebar";
import { sendMessageToAI } from "./services/gemini";
import "./App.css";
function App() {
  const [memory, setMemory] = useState(() => {
    try {
      const savedMemory = localStorage.getItem("ai-memory");
      return savedMemory ? JSON.parse(savedMemory) : {};
    } catch {
      return {};
    }
  });
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem("ai-chats");
      return savedChats ? JSON.parse(savedChats) : [];
    } catch (error) {
      console.error("❌ Error loading chats:", error);
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streaming]);
  useEffect(() => {
    try {
      localStorage.setItem("ai-chats", JSON.stringify(chats));
    } catch (error) {
      console.error("❌ Error saving chats:", error);
    }
  }, [chats]);
  useEffect(() => {
    try {
      localStorage.setItem("ai-memory", JSON.stringify(memory));
    } catch (error) {
      console.error("❌ Error saving memory:", error);
    }
  }, [memory]);
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const detectMemory = (text) => {
    const value = text.trim();
    const arabicNameMatch = value.match(
      /(?:افتكر|تذكر|احفظ|خليك فاكر)(?:\s+إن|\s+ان)?\s+(?:اسمي|اسمى)\s+(.+)/i,
    );
    const simpleArabicNameMatch = value.match(/(?:اسمي|اسمى)\s+(.+)/i);
    const englishNameMatch = value.match(
      /(?:remember\s+that\s+)?my\s+name\s+is\s+(.+)/i,
    );
    let name = null;
    if (arabicNameMatch) {
      name = arabicNameMatch[1];
    } else if (
      simpleArabicNameMatch &&
      /(?:افتكر|تذكر|احفظ|خليك فاكر)/i.test(value)
    ) {
      name = simpleArabicNameMatch[1];
    } else if (englishNameMatch) {
      name = englishNameMatch[1];
    }
    if (name) {
      name = name
        .trim()
        .replace(/[.!؟?]+$/, "")
        .trim();
      if (name.length > 0 && name.length < 60) {
        setMemory((prevMemory) => ({ ...prevMemory, name }));
      }
    }
  };
  const createChat = (firstMessage) => {
    const title =
      firstMessage && firstMessage.trim()
        ? firstMessage.length > 40
          ? firstMessage.slice(0, 40) + "..."
          : firstMessage
        : "Image chat";
    const newChat = { id: Date.now(), title, messages: [] };
    setChats((prevChats) => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };
  const updateChatMessages = (chatId, newMessages) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: newMessages } : chat,
      ),
    );
  };
  const regenerateResponse = async (messageIndex) => {
    if (loading || streaming) {
      return;
    }
    const userMessages = messages.slice(0, messageIndex);
    const currentUserMessage = [...userMessages]
      .reverse()
      .find((msg) => msg.sender === "user");
    if (!currentUserMessage) {
      return;
    }
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createChat(currentUserMessage.text);
    }
    setMessages(userMessages);
    updateChatMessages(chatId, userMessages);
    setLoading(true);
    setStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let streamedResponse = "";
    try {
      await sendMessageToAI(
        userMessages,
        (chunk) => {
          streamedResponse += chunk;
          const streamingMessages = [
            ...userMessages,
            { text: streamedResponse, sender: "ai", streaming: true },
          ];
          setMessages(streamingMessages);
        },
        controller.signal,
        memory,
      );
      const finalMessages = [
        ...userMessages,
        { text: streamedResponse, sender: "ai" },
      ];
      setMessages(finalMessages);
      updateChatMessages(chatId, finalMessages);
    } catch (error) {
      if (error.name === "AbortError") {
        if (streamedResponse) {
          const stoppedMessages = [
            ...userMessages,
            { text: streamedResponse, sender: "ai" },
          ];
          setMessages(stoppedMessages);
          updateChatMessages(chatId, stoppedMessages);
        } else {
          setMessages(userMessages);
          updateChatMessages(chatId, userMessages);
        }
        return;
      }
      console.error("❌ Regenerate Error:", error);
      const errorMessages = [
        ...userMessages,
        {
          text: error.message || "Unable to generate a response.",
          sender: "ai",
          error: true,
        },
      ];
      setMessages(errorMessages);
      updateChatMessages(chatId, errorMessages);
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setStreaming(false);
    }
  };
  const sendMessage = async (selectedImage = null) => {
    const image = selectedImage?.preview || null;
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !image) || loading || streaming) {
      return;
    }
    if (trimmedMessage) {
      detectMemory(trimmedMessage);
    }
    const userMsg = {
      text: trimmedMessage,
      sender: "user",
      ...(image ? { image } : {}),
    };
    const updatedMessages = [...messages, userMsg];
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createChat(trimmedMessage);
    }
    setMessages(updatedMessages);
    updateChatMessages(chatId, updatedMessages);
    setMessage("");
    setLoading(true);
    setStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let streamedResponse = "";
    try {
      await sendMessageToAI(
        updatedMessages,
        (chunk) => {
          streamedResponse += chunk;
          const streamingMessages = [
            ...updatedMessages,
            { text: streamedResponse, sender: "ai", streaming: true },
          ];
          setMessages(streamingMessages);
        },
        controller.signal,
        memory,
      );
      const finalMessages = [
        ...updatedMessages,
        { text: streamedResponse, sender: "ai" },
      ];
      setMessages(finalMessages);
      updateChatMessages(chatId, finalMessages);
    } catch (error) {
      if (error.name === "AbortError") {
        if (streamedResponse) {
          const stoppedMessages = [
            ...updatedMessages,
            { text: streamedResponse, sender: "ai" },
          ];
          setMessages(stoppedMessages);
          updateChatMessages(chatId, stoppedMessages);
        } else {
          setMessages(updatedMessages);
          updateChatMessages(chatId, updatedMessages);
        }
        return;
      }
      console.error("❌ AI Error:", error);
      const errorMessages = [
        ...updatedMessages,
        {
          text: error.message || "Unable to connect to AI Noury.",
          sender: "ai",
          error: true,
        },
      ];
      setMessages(errorMessages);
      updateChatMessages(chatId, errorMessages);
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setStreaming(false);
    }
  };
  const retryLastMessage = () => {
    if (loading || streaming) {
      return;
    }
    const lastUserMessageIndex = [...messages]
      .map((msg, index) => ({ ...msg, index }))
      .reverse()
      .find((msg) => msg.sender === "user");
    if (!lastUserMessageIndex) {
      return;
    }
    const userMessages = messages.slice(0, lastUserMessageIndex.index + 1);
    const chatId = currentChatId;
    if (!chatId) {
      return;
    }
    setMessages(userMessages);
    updateChatMessages(chatId, userMessages);
    setLoading(true);
    setStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let streamedResponse = "";
    sendMessageToAI(
      userMessages,
      (chunk) => {
        streamedResponse += chunk;
        const streamingMessages = [
          ...userMessages,
          { text: streamedResponse, sender: "ai", streaming: true },
        ];
        setMessages(streamingMessages);
      },
      controller.signal,
      memory,
    )
      .then(() => {
        const finalMessages = [
          ...userMessages,
          { text: streamedResponse, sender: "ai" },
        ];
        setMessages(finalMessages);
        updateChatMessages(chatId, finalMessages);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        const errorMessages = [
          ...userMessages,
          {
            text: error.message || "Unable to generate a response.",
            sender: "ai",
            error: true,
          },
        ];
        setMessages(errorMessages);
        updateChatMessages(chatId, errorMessages);
      })
      .finally(() => {
        abortControllerRef.current = null;
        setLoading(false);
        setStreaming(false);
      });
  };
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  const editMessage = (text) => {
    if (loading || streaming) {
      return;
    }
    setMessage(text);
  };
  const startNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setMessage("");
    setCurrentChatId(null);
    setSidebarOpen(false);
    setLoading(false);
    setStreaming(false);
  };
  const openChat = (chat) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages(chat.messages || []);
    setCurrentChatId(chat.id);
    setMessage("");
    setSidebarOpen(false);
    setLoading(false);
    setStreaming(false);
  };
  const deleteChat = (chatId) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
      setMessage("");
    }
  };
  const clearChats = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all chats?",
    );
    if (!confirmed) {
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setChats([]);
    setMessages([]);
    setCurrentChatId(null);
    setMessage("");
    setLoading(false);
    setStreaming(false);
  };
  const latestMessageIndex = messages.length - 1;
  return (
    <div className="chat-app">
      {" "}
      <Sidebar
        onNewChat={startNewChat}
        chats={chats}
        onOpenChat={openChat}
        onDeleteChat={deleteChat}
        onClearChats={clearChats}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentChatId={currentChatId}
      />{" "}
      <div className="chat-main">
        {" "}
        <ChatHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setSidebarOpen={setSidebarOpen}
        />{" "}
        <main className="chat-messages">
          {" "}
          {messages.length === 0 && !loading && !streaming && (
            <div className="welcome-screen">
              {" "}
              <div className="welcome-avatar"> 🤖 </div>{" "}
              <div className="welcome-content">
                {" "}
                <p className="welcome-small-title"> Welcome to </p>{" "}
                <h2>
                  {" "}
                  AI Noury <span>👋</span>{" "}
                </h2>{" "}
                <p className="welcome-description">
                  {" "}
                  Your friendly AI assistant. Ask me anything, brainstorm ideas,
                  learn something new, or just have a conversation.{" "}
                </p>{" "}
              </div>{" "}
              <div className="suggestion-grid">
                {" "}
                <button
                  className="suggestion-card"
                  onClick={() =>
                    setMessage("Explain something to me in a simple way")
                  }
                >
                  {" "}
                  <span className="suggestion-icon"> 💡 </span>{" "}
                  <span> Explain something </span>{" "}
                  <small> Make it easy to understand </small>{" "}
                </button>{" "}
                <button
                  className="suggestion-card"
                  onClick={() =>
                    setMessage("Help me learn something new today")
                  }
                >
                  {" "}
                  <span className="suggestion-icon"> 📚 </span>{" "}
                  <span> Help me learn </span>{" "}
                  <small> Discover something interesting </small>{" "}
                </button>{" "}
                <button
                  className="suggestion-card"
                  onClick={() => setMessage("Give me some creative ideas")}
                >
                  {" "}
                  <span className="suggestion-icon"> ✨ </span>{" "}
                  <span> Get creative </span>{" "}
                  <small> Ideas, projects & inspiration </small>{" "}
                </button>{" "}
                <button
                  className="suggestion-card"
                  onClick={() => setMessage("Help me write something")}
                >
                  {" "}
                  <span className="suggestion-icon"> ✍️ </span>{" "}
                  <span> Help me write </span>{" "}
                  <small> Messages, ideas & more </small>{" "}
                </button>{" "}
              </div>{" "}
            </div>
          )}{" "}
          {messages.map((msg, index) => (
            <div key={index}>
              {" "}
              <Message
                text={msg.text}
                image={msg.image}
                sender={msg.sender}
                showRegenerate={
                  msg.sender === "ai" &&
                  index === latestMessageIndex &&
                  !loading &&
                  !streaming &&
                  !msg.streaming &&
                  !msg.error
                }
                onRegenerate={() => regenerateResponse(index)}
                onEdit={editMessage}
              />{" "}
              {msg.error &&
                index === latestMessageIndex &&
                !loading &&
                !streaming && (
                  <button className="retry-btn" onClick={retryLastMessage}>
                    {" "}
                    ↻ Try Again{" "}
                  </button>
                )}{" "}
              {msg.sender === "ai" &&
                index === latestMessageIndex &&
                !loading &&
                !streaming &&
                !msg.streaming &&
                !msg.error && (
                  <div className="chat-suggestions">
                    {" "}
                    <p> Try asking: </p>{" "}
                    <button
                      onClick={() =>
                        setMessage("Can you explain this more simply?")
                      }
                    >
                      {" "}
                      Explain simply{" "}
                    </button>{" "}
                    <button
                      onClick={() => setMessage("Can you give me an example?")}
                    >
                      {" "}
                      Give an example{" "}
                    </button>{" "}
                    <button
                      onClick={() =>
                        setMessage("Can you explain this step by step?")
                      }
                    >
                      {" "}
                      Step by step{" "}
                    </button>{" "}
                  </div>
                )}{" "}
            </div>
          ))}{" "}
          {loading && !streaming && (
            <Message text="Thinking..." sender="ai" />
          )}{" "}
          <div ref={messagesEndRef} />{" "}
        </main>{" "}
        <ChatInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          loading={loading || streaming}
          stopGenerating={stopGenerating}
        />{" "}
      </div>{" "}
    </div>
  );
}
export default App;
