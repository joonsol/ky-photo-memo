const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
dotenv.config();

const app = express();
const PORT = process.env.PORT


app.use(cors({
  origin: process.env.FRONT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err.message));


app.get("/", (_req, res) => res.send("PhotoMemo API OK"));


app.use((req, res) => {

  res.status(500).json({ message: "서버 오류"});
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);

});
