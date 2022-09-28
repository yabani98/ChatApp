require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const CreateMessage = require("./utils/CreateMessage");
const GetMessages = require("./utils/GetMessages");
const app = express();


app.use(cors());
app.use(logger("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP,
  },
});
const roomsLists = {};
const usersInfo = {};
const joinRoom = (userId, room) => {
  usersInfo[userId].rooms.push(room);
  return true;
};
const leaveRoom = (userId, room) => {
  usersInfo[userId].rooms = usersInfo[userId].rooms.filter(
    (curRoom) => curRoom !== room
  );
  return true;
};

io.on("connection", (socket) => {
  console.log(`User ${socket.id} is connected`);
  socket.on("newUser", async (userName, room) => {
    console.log("newUser: ", userName,room, socket.id);
    const user = {
      id: socket.id,
      userName,
      rooms: [room],
    };
    const message = {
      senderId: "ChatBot",
      room,
      isPublic: true,
      content: `${userName} joined the Room`,
    };
    if (!roomsLists[room]) roomsLists[room] = [];
    roomsLists[room].push(user);
    usersInfo[socket.id] = user;

    await CreateMessage(message);

    socket.join(room);
    io.sockets.in(room).emit("chatUsers", roomsLists[room]);
    io.sockets.in(room).emit("newMessage", message);
    console.log('newUser END',socket.id);
  });
  socket.on("getAllUsers", () => {
    console.log('getAllUsers',socket.id);
    const allUsersNames = Object.entries(usersInfo).reduce(
      (prev, [, user]) => [...prev, user],
      []
    );

    socket.emit("chatUsers", allUsersNames,true);
    console.log('getAllUsers END',socket.id);
  });
  socket.on("joinRoom", async (room) => {
    console.log('joinRoom',room,socket.id);
    if (!roomsLists[room]) roomsLists[room] = [];
    const message = {
      senderId: "ChatBot",
      room,
      isPublic: true,
      content: `${usersInfo[socket.id].userName} joined the Room`,
    };

    joinRoom(socket.id, room);
    roomsLists[room].push(usersInfo[socket.id]);
    await CreateMessage(message);
    socket.join(room);
    io.sockets.in(room).emit("chatUsers", roomsLists[room]);
    io.sockets.in(room).emit("newMessage", message);
    console.log('joinRoom END',socket.id);
  });

  socket.on("leaveRoom", async (room) => {
    console.log('leaveRoom',room,socket.id);
    const message = {
      senderId: "ChatBot",
      room,
      isPublic: true,
      content: `${usersInfo[socket.id].userName} left the Room`,
    };
    leaveRoom(socket.id, room);
    roomsLists[room] = roomsLists[room].filter((user) => user.id !== socket.id);
    await CreateMessage(message);
    socket.leave(room);
    io.sockets.in(room).emit("chatUsers", roomsLists[room]);
    io.sockets.in(room).emit("newMessage", message);
    console.log('leaveRoom END',socket.id);
  });

  socket.on("newMessage", async (room, message) => {
    console.log('newMessage',room,message,socket.id);
    await CreateMessage(message);
    socket.to(room).emit("newMessage", message);
    console.log('newMessage END',socket.id);
  });

  socket.on("getMessages", async (room, isPublic) => {
    console.log('getMessages',room,isPublic,socket.id);
    const messages = await GetMessages(room, isPublic, socket.id);

    socket.emit("getMessages", messages);
    console.log('getMessages END',socket.id);
  });

  socket.on("disconnect", () => {
    console.log("disconnect: ", socket.id);
    usersInfo[socket.id]?.rooms.forEach(async (room) => {
      roomsLists[room] = roomsLists[room].filter(
        (user) => user.id !== socket.id
      );
      socket.to(room).emit("chatUsers", roomsLists[room]);
      socket.leave(room);
    });

    delete usersInfo[socket.id];
  });
});

module.exports = io;
