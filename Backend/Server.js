const express = require('express')
const cors = require('cors')
const {connectdb} = require('./config/db')
const authRoute = require('./modules/auth/auth.route')
const uploadRoute = require('./modules/uploadvideo/uploadvideo.route')
const videoDataRoute = require('./modules/videodata/videodata.route')
const db = require('./config/db2')
const viewsRoute = require('./modules/videoviews/videoviews.route')
// const { deleteOldUploadFiles } = require('./modules/videodata/videodata.helper')
// const fs = require("fs");
// const path = require("path");

const app = express()

connectdb()
db;

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
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ extended: true, limit: "2gb" }));




app.get('/',(req,res)=>{
    return res.send("Backend is runing")
})

app.get('/health',(req,res) => {
    return res.send({'status':'ok','version':'1.0.0','date' : '04-02-2026 04:34PM'})
})


// async function createCollection() {
//   const collections = await db.listCollections();

//   const exists = collections.some(
//     (c) => c.name === "video_views_collection"
//   );

//   if (!exists) {
//     await db.createCollection("video_views_collection");
//     console.log("✅ Collection created: video_views_collection");
//   } else {
//     console.log("ℹ️ Collection already exists");
//   }
// }

// createCollection();



app.use('/api/v1',authRoute)

//this route contain upload video route + getAllVideos route
app.use('/api/v1',uploadRoute)

//this route is responsible for get and post video data
app.use('/api/v1',videoDataRoute)

// deleteOldUploadFiles();

//this routes are for cassandra post views
app.use('/api/v1',viewsRoute)

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT,() => {
    console.log(`The backend is runing on port ${PORT}`)
})

server.setTimeout(10 * 60 * 1000);

