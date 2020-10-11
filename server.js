const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//used to set "static" as a public folder so that we can access the frontend(html files) on our server
app.use(express.static(path.join(__dirname, "public")));
const botName = "ChatCord BOT";
//what to do when a client connects, this shows whatever message we want to display
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //use to welcome the current registered user to chatcord

    socket.emit("message", formatMessage(botName, "Welcome to CHATCORD")); //sends the message to the user only

    //broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, ` ${user.username} has joined the chat`)
      ); //broadcast.emit sends the message to everybody except the user itself

    //send users name and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for the chat-message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //runs when a user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      ); //io.emit send the message to everybody that the user has disconnected

      //send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
