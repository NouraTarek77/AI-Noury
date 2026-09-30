import "./ChatInput.css";

import {
  useRef,
  useState,
} from "react";

const API_URL =
  "https://ai-noury.vercel.app";

function ChatInput({
  message,
  setMessage,
  sendMessage,
  loading,
  stopGenerating,
}) {
  const fileInputRef =
    useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(null);

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    isTranscribing,
    setIsTranscribing,
  ] = useState(false);

  // ========================================
  // VOICE LANGUAGE
  // ========================================

  const [
    voiceLanguage,
    setVoiceLanguage,
  ] = useState("ar");


  // ========================================
  // IMAGE SELECT
  // ========================================

  const handleImageSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select an image file."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setSelectedImage({
        file,
        preview: reader.result,
      });
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };


  // ========================================
  // REMOVE IMAGE
  // ========================================

  const removeImage = () => {
    setSelectedImage(null);
  };


  // ========================================
  // START RECORDING
  // ========================================

  const startRecording = async () => {
    try {
      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        alert(
          "Your browser does not support microphone access."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];


      mediaRecorder.ondataavailable =
        (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };


      mediaRecorder.onstop =
        async () => {
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          const audioBlob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  mediaRecorder.mimeType ||
                  "audio/webm",
              }
            );

          await transcribeAudio(
            audioBlob
          );
        };


      mediaRecorder.start();

      setIsRecording(true);

    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Microphone permission is required."
      );
    }
  };


  // ========================================
  // STOP RECORDING
  // ========================================

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };


  // ========================================
  // TOGGLE RECORDING
  // ========================================

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  // ========================================
  // TRANSCRIBE AUDIO
  // ========================================

  const transcribeAudio =
    async (audioBlob) => {
      try {
        setIsTranscribing(true);

        const formData =
          new FormData();


        const extension =
          audioBlob.type.includes(
            "webm"
          )
            ? "webm"
            : "wav";


        const audioFile =
          new File(
            [audioBlob],
            `recording.${extension}`,
            {
              type:
                audioBlob.type ||
                "audio/webm",
            }
          );


        formData.append(
          "audio",
          audioFile
        );


        // Send selected language
        formData.append(
          "language",
          voiceLanguage
        );


        const response =
          await fetch(
            `${API_URL}/api/transcribe`,
            {
              method: "POST",
              body: formData,
            }
          );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to transcribe audio."
          );
        }


        if (data.text) {
          setMessage(
            (currentMessage) => {
              const current =
                currentMessage.trim();

              if (!current) {
                return data.text;
              }

              return `${current} ${data.text}`;
            }
          );
        }

      } catch (error) {
        console.error(
          "Transcription error:",
          error
        );

        alert(
          error.message ||
            "Could not convert your voice to text."
        );

      } finally {
        setIsTranscribing(false);
      }
    };


  // ========================================
  // SEND
  // ========================================

  const handleSend = () => {
    if (isTranscribing) {
      return;
    }

    sendMessage(selectedImage);

    setSelectedImage(null);
  };


  // ========================================
  // UI
  // ========================================

  return (
    <div className="chat-input-container">

      {selectedImage && (
        <div className="selected-image-preview">

          <img
            src={
              selectedImage.preview
            }
            alt="Selected"
          />

          <button
            type="button"
            className="remove-image-btn"
            onClick={removeImage}
            aria-label="Remove image"
          >
            ×
          </button>

        </div>
      )}


      {/* IMAGE BUTTON */}

      <button
        type="button"
        className="attach-image-btn"
        onClick={() =>
          fileInputRef.current?.click()
        }
        disabled={
          loading ||
          isRecording ||
          isTranscribing
        }
        aria-label="Attach image"
      >
        📎
      </button>


      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={
          handleImageSelect
        }
      />


      {/* VOICE LANGUAGE */}

      <select
        className="voice-language-select"
        value={voiceLanguage}
        onChange={(e) =>
          setVoiceLanguage(
            e.target.value
          )
        }
        disabled={
          loading ||
          isRecording ||
          isTranscribing
        }
        aria-label="Voice language"
      >
        <option value="ar">
          🇪🇬 عربي
        </option>

        <option value="en">
          🇺🇸 English
        </option>
      </select>


      {/* VOICE BUTTON */}

      <button
        type="button"
        className={`voice-btn ${
          isRecording
            ? "recording"
            : ""
        }`}
        onClick={
          toggleRecording
        }
        disabled={
          loading ||
          isTranscribing
        }
        aria-label={
          isRecording
            ? "Stop recording"
            : "Start recording"
        }
      >
        {isTranscribing
          ? "⏳"
          : isRecording
            ? "⏹"
            : "🎤"}
      </button>


      {/* TEXT INPUT */}

      <input
        type="text"
        placeholder={
          isTranscribing
            ? "Converting voice to text..."
            : isRecording
              ? "Listening..."
              : "Type your message..."
        }
        value={message}
        autoFocus
        disabled={
          loading ||
          isRecording ||
          isTranscribing
        }
        onChange={(e) =>
          setMessage(
            e.target.value
          )
        }
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !loading &&
            !isRecording &&
            !isTranscribing
          ) {
            handleSend();
          }
        }}
      />


      {/* SEND / STOP */}

      {loading ? (
        <button
          className="stop-btn"
          onClick={
            stopGenerating
          }
          aria-label="Stop generating"
        >
          ■
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={
            isRecording ||
            isTranscribing
          }
          aria-label="Send message"
        >
          ➤
        </button>
      )}

    </div>
  );
}

export default ChatInput;