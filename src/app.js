// express is used to handling requests and response
import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser"
const app = express()


// configuration for cors
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
})) 

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))  // public assest stored in folder named "public"
app.use(cookieParser())
// cookieParser is used so that we can perfrom cred operation on user's cookies (means we can access cookies of user's browser from our server and can set cookies also)


// routes import
import userRouter from './routes/user.routes.js'

// routes declaration 
// since routes are wriiten seperately now not in app.js so we have to use app.use and not app.get
// app.use("/users", userRouter) -> this is also completely fine
app.use("/api/v1/users", userRouter)  // but this is better in production code -> whenever someone hits the url /api/v1/users, then controll will go to userRouter, which will go in file user.routes.js and execute as per the code written there
export {app}