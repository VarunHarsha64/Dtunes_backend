import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected! Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
});
