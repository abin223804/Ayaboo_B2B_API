import express from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import connectDB from "./config/mongoDb.js";
import cors from 'cors'
import userRoute from './route/userRoute.js'
import adminRoute from './route/adminRoute.js'

import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.urlencoded({ extended: true }));
 // Middleware to parse JSON request bodies----------------------------------------------
app.use(express.json());
app.use(cookieParser());
 

const corsOptions = {
  origin: 'http://localhost:5173', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
  credentials: true, 
  optionsSuccessStatus: 204 
};


app.use(cors(corsOptions));

// api route middlewares----------------------------------------------------------------
app.use('/user', userRoute)  
app.use('/admin', adminRoute);  



app.listen(PORT, () => {
  console.log(chalk.magenta(`Server is running on port ${PORT} ✌️`));
});



connectDB();

 