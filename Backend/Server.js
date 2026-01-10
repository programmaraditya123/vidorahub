const express = require('express')
const cors = require('cors')
const {connectdb} = require('./config/db')
const authRoute = require('./modules/auth/auth.route')
const uploadRoute = require('./modules/uploadvideo/uploadvideo.route')

const app = express()

connectdb()

const allowed_origins = [
    "http://localhost:3000",
    "https://vidorahub-v6qk.vercel.app"
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

app.get('/',(req,res)=>{
    return res.send("Backend is runing")
})

app.get('/health',(req,res) => {
    return res.send({'status':'ok','version':'1.0.0','date' : '10-01-2026 04:34PM'})
})

app.use('/api/v1',authRoute)

app.use('/api/v1',uploadRoute)

const PORT = process.env.PORT || 8000;

app.listen(PORT,() => {
    console.log(`The backend is runing on port ${PORT}`)
})