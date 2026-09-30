const API_URL = "https://ai-noury.vercel.app/api/chat";
export async function sendMessageToAI(messages, onChunk, signal, memory = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, memory }),
      signal,
    });
    if (!response.ok) {
      let errorMessage = "Something went wrong while contacting AI Noury.";
      try {
        const data = await response.json();
        if (data?.error) {
          errorMessage = data.error;
        }
      } catch {
        if (response.statusText) {
          errorMessage = response.statusText;
        }
      }
      throw new Error(errorMessage);
    }
    if (!response.body) {
      throw new Error("Streaming is not supported by this browser.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) {
        continue;
      }
      fullResponse += chunk;
      onChunk(chunk);
    }
    const remaining = decoder.decode();
    if (remaining) {
      fullResponse += remaining;
      onChunk(remaining);
    }
    if (!fullResponse.trim()) {
      throw new Error("AI Noury returned an empty response. Please try again.");
    }
    return fullResponse;
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }
    if (
      error.name === "TypeError" &&
      error.message.toLowerCase().includes("fetch")
    ) {
      throw new Error(
        "Unable to connect to AI Noury. Please make sure the server is running.",
      );
    }
    console.error("❌ Chat Error:", error);
    throw error;
  }
}
