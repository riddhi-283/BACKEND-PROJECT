import mongoose from 'mongoose'
import {DB_NAME} from "../constants.js"

// make a function for db connetion and we will import that then, fn will be async because db is in different continent
const connectDB = async() => {
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       // whatever object we got after connection is stored in the variable connectionInstance
       console.log(`\n MongoDB connected!! DB HOST: 
        ${connectionInstance.connection.host}`);
       
    } catch(error){
       console.log("MONGODB connection error: ", error);
       process.exit(1)
    }
}

export default connectDB