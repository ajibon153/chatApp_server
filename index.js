const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const { addUser, getUser, removeUser, getUsersInRoom } = require("./user.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  console.log("Sudah terhubung dengan socket io");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    // yang aka di compile di frontEnd
    // user was welcome to chat
    console.log(user);
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, selamat datang di room ${user.room}`,
    });

    // send message to all that a user joined
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} telah bergabung`,
    });

    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      user: user.name,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    // console.log("user logout");
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} Has Left`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => {
  console.log("server start " + PORT);
});
