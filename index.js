const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const usuarioSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
  },
  { versionKey: false },
);

const User = mongoose.model("User", usuarioSchema);

const exercicioSchema = mongoose.Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: Date,
    userId: String,
  },
  { versionKey: false },
);

const Exercicio = mongoose.model("Exercise", exercicioSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const buscaUsuario = await User.findOne({ username });

  if (buscaUsuario) {
    res.json(buscaUsuario);
  }

  const user = await User.create({ username });

  res.json(user);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;
  const buscaUsuario = await User.findById(userId);

  if (!buscaUsuario) {
    res.json("O usuário não existe com esse id");
  }

  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  await Exercicio.create({
    username: buscaUsuario.username,
    description,
    duration,
    date,
    userId,
  });

  res.send({
    _id: buscaUsuario._id,
    username: buscaUsuario.username,
    description,
    duration: parseInt(duration),
    date,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let { from, to, limit } = req.query;
  const userId = req.params._id;
  const buscaUsuario = await User.findById(userId);

  if (!buscaUsuario) {
    res.json("O usuário não existe com esse id");
  }

  let filtro = { userId };
  let filtroData = {};

  if (from) {
    filtroData["$gte"] = new Date(from);
  }

  if (to) {
    filtroData["$lte"] = new Date(to);
  }

  if (from || to) {
    filtro.date = filtroData;
  }

  if (!limit) {
    limit = 100;
  }

  let exercicios = await Exercicio.find(filtro).limit(limit);
  exercicios = exercicios.map((exercicio) => {
    return {
      description: exercicio.description,
      duration: exercicio.duration,
      date: exercicio.date.toDateString(),
    };
  });

  res.json({
    username: buscaUsuario.username,
    count: exercicios.length,
    _id: userId,
    log: exercicios,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
