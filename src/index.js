//  First way of loading env variables
// require('dotenv').config({path: './env'})  -> not pref dont use this

import connectDB from './db/index.js'

// second way of loading env variables ->preferable
import dotenv from "dotenv"
dotenv.config({
    path: './env'
})
// make sure to add experimental flags in "scripts" in package.json upon using this method
connectDB()




// FIRST WAY OF DATABASE CONNECTION
// import mongoose from 'mongoose'
// import { DB_NAME } from "./constants.js";
// import express from 'express'
// const app = express()

// ;(async () => {
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        // adding a listener
//        app.on("error", (error) => {
//         console.log("ERR:", error);
//         throw error
//        })

//        app.listen(process.env.PORT, () => {
//         console.log(`App is listening at port ${process.env.PORT}`)
//        })

//     } catch(error){
//         console.error("ERROR: ", error);
//         throw err 
//     }
// })
