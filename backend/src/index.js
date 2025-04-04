import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://ch-make.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

app.get("/test-db", async (req, res) => {
  try {
      const db = mongoose.connection;
      if (db.readyState === 1) {
          return res.json({ success: true, message: "MongoDB is connected!" });
      } else {
          return res.status(500).json({ success: false, message: "MongoDB not connected!" });
      }
  } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
  }
});


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const healthRoutes = express.Router();
healthRoutes.get('/', function(req, res) {
  res.status(200).json({sucess: true});
});

app.use("/api/health", healthRoutes);
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
