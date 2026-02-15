const express = require('express')
const cors = require('cors');
const { default: client } = require('./config/redis');
const bitmapRoute = require('./routes/bitmap.routes');
const  {connectdb} = require('./config/db')
const  {db2} = require('./config/db2')
const followRoute = require('./modules/FollowUnfollow/FollowUnfollow.route')

const app = express();

client;
connectdb();
db2;

const allowed_origins = [
    "http://localhost:3000",
    "https://vidorahub-v6qk.vercel.app",
    "https://www.vidorahub.com"
]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowed_origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With"
  ],
  credentials: true,  
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use('/bitmap/v1',bitmapRoute)

app.use('/bitmap/v1',followRoute)

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error1" });
});

module.exports = app;