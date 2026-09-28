import "./Message.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
function Message({
  text,
  image,
  sender,
  onRegenerate,
  showRegenerate,
  onEdit,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => {
        setCopiedCode(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };
  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      setCopiedResponse(true);
      setTimeout(() => {
        setCopiedResponse(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };
  const renderCode = ({ children, className }) => {
    return <code className={className}> {children} </code>;
  };
  return (
    <div className={`message ${sender}-message`}>
      {" "}
      {sender === "ai" && <div className="message-avatar"> 🤖 </div>}{" "}
      <div className="message-content">
        {" "}
        {image && (
          <div className="message-image-wrapper">
            {" "}
            <img
              src={image}
              alt="User uploaded"
              className="message-image"
            />{" "}
          </div>
        )}{" "}
        {text === "Thinking..." ? (
          <div className="typing">
            {" "}
            <span className="dot"></span> <span className="dot"></span>{" "}
            <span className="dot"></span>{" "}
          </div>
        ) : sender === "ai" ? (
          <>
            {" "}
            {text && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                children={String(text)}
                components={{
                  pre({ children }) {
                    let code = "";
                    if (
                      children &&
                      typeof children === "object" &&
                      children.props
                    ) {
                      const codeChildren = children.props.children;
                      if (Array.isArray(codeChildren)) {
                        code = codeChildren.join("");
                      } else {
                        code = String(codeChildren || "");
                      }
                    }
                    return (
                      <div className="code-block-wrapper">
                        {" "}
                        <button
                          className="copy-code-btn"
                          onClick={() => copyCode(code)}
                        >
                          {" "}
                          {copiedCode ? "✓ Copied" : "Copy"}{" "}
                        </button>{" "}
                        <pre> {children} </pre>{" "}
                      </div>
                    );
                  },
                  code: renderCode,
                }}
              />
            )}{" "}
            <div className="message-actions">
              {" "}
              {text && (
                <button className="copy-response-btn" onClick={copyResponse}>
                  {" "}
                  {copiedResponse ? "✓ Copied" : "📋 Copy response"}{" "}
                </button>
              )}{" "}
              {showRegenerate && (
                <button className="regenerate-btn" onClick={onRegenerate}>
                  {" "}
                  🔄 Regenerate{" "}
                </button>
              )}{" "}
            </div>{" "}
          </>
        ) : (
          <>
            {" "}
            {text && <p>{text}</p>}{" "}
            <button className="edit-message-btn" onClick={() => onEdit(text)}>
              {" "}
              ✏️ Edit{" "}
            </button>{" "}
          </>
        )}{" "}
      </div>{" "}
    </div>
  );
}
export default Message;
