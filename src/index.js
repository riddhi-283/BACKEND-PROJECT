//  First way of loading env variables
// require('dotenv').config({path: './env'})  -> not pref dont use this


// SECOND WAY OF DATABASE CONNECTION -> 
import connectDB from './db/index.js'

// second way of loading env variables ->preferable ->write connection logic in a seperate fn in a file in db folder and then import than fn here in main index.js file

import dotenv from "dotenv"
dotenv.config({
    path: './env'
})
// make sure to add experimental flags in "scripts" in package.json upon using this method
connectDB()




// FIRST WAY OF DATABASE CONNECTION ->write all connection logic in index.js file itself

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
