import React, { useEffect, useRef, useState } from "react";
import "../styles/Board.css";
const Board = ({ socket, userName, room, isPublic, isJoined, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const textAreaRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    console.log("change", room); 
  socket.emit("getMessages", room, isPublic, receiverId);
    const getMessageListener = (receivedMessages) => {
      setMessages(receivedMessages);
    };
    const newMessageListener = (message) => {
      if(room === message.room)  
      setMessages((prevState) =>[...prevState, message]);
    };
    socket.on("getMessages", getMessageListener);
    socket.on("newMessage", newMessageListener);

    return () => {
      socket.off("getMessages", getMessageListener);
      socket.off("newMessage", newMessageListener);
    };
  }, [room]);
  useEffect(() => {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className="board">
      <div className="messages">
        {messages.map((message, id) => {
          return (
            <div
              className={
                "text-center bg-dark text-white" +
                (message.senderId === "ChatBot"
                  ? " p1"
                  : message.senderId === socket.id
                  ? " p2"
                  : " p3")
              }
              key={id}
            >
              <p>
                {(message.senderId !== "ChatBot" &&
                message.senderName !== userName &&
                message.isPublic
                  ? message.senderName + ":"
                  : "") + message.content}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="message-input form-floating">
        <textarea
          className="form-control"
          placeholder="Leave a message here"
          id="floatingTextarea"
          style={{ height: "70px" }}
          ref={textAreaRef}
        ></textarea>
        <label htmlFor="floatingTextarea">Message...</label>
        <button
          className="btn btn-primary"
          disabled={!isJoined}
          onClick={() => {
            if (textAreaRef.current.value !== "") {
              const message = {
                senderId: socket.id,
                senderName: userName,
                room,
                isPublic,
                content: textAreaRef.current.value,
              };
              if (!isPublic) message.receiverId = receiverId;
              setMessages((prevState) => [...prevState, message]);
              socket.emit("newMessage", room, message);
              textAreaRef.current.value = "";
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Board;
