import React, { useEffect, useRef, useState } from "react";
import "../styles/Board.css";
const Board = ({ socket, room, isPublic }) => {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();
  useEffect(() => {
    socket.emit("getMessages", room, isPublic);
  }, [room]);
  useEffect(() => {
    const getMessageListener = (receivedMessages) => {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      setMessages(receivedMessages);
    };
    socket.on("getMessages", getMessageListener);

    return () => socket.removeListener("getMessages", getMessageListener);
  }, [socket]);

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
              <p>{message.content}</p>
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
        ></textarea>
        <label HtmlFor="floatingTextarea">Message...</label>
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
};

export default Board;