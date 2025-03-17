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

export {app}