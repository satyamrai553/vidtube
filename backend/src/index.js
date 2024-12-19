import {app} from "./app.js";
import connectDB from './db/index.js';
import dotenv from 'dotenv';

dotenv.config({
    path: "./.env"
})




const PORT = process.env.PORT || 7000;


connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log("ERROR !!!", error);
        throw error
    })
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongodb connection FAILED !!! ", err)
})


