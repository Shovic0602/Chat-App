const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const path = require('path')

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
dotenv.config();
// connectDB();

app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("ApI is Running");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);



const __dirname1 = path.resolve();
if(process.env.NODE_ENV === "production"){
   app.use(express.static(path.join(__dirname1, "/frontend/build")));

    app.get("*", (req, res) =>
      res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
    );
}else{
  app.get("/", (req,res) => {
    res.send("API is Running Successfully");
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB();
    //app.listen(PORT, console.log("server started on PORT 5000"));
    const server = app.listen(PORT, console.log("server started on PORT 5000"));
    //   } catch (error) {
    //     console.log(error.message);
    //   }
    // };
    // start();

    // const server = app.listen(PORT, console.log("server started on PORT 5000"));
    const io = require("socket.io")(server, {
      cors: {
        pingTimeout: 60000,
        origin: "http://localhost:3000",
      },
    });

    io.on("connection", (socket) => {
      console.log("connected to socket.io");

      socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
        // console.log(userData._id);
      });

      socket.on("join chat", (room) => {
        socket.join(room);
        // console.log("User joined room : " + room);
      });

      socket.on("typing", (room) => socket.in(room).emit("typing"));
      socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

      socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
          if (user._id === newMessageReceived.sender._id) return;
          console.log(user._id);
          socket.in(user._id).emit("message received ", newMessageReceived);
          console.log(newMessageReceived.content);
        });
      });

      socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};
start();
