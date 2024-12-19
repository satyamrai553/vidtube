import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";



const connectDB = async ()=>{
    try {
        const response = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connecred ! DB host: ${response.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection FAILED: ", error)
        process.exit(1);
    }
}


export default connectDB;