import mongoose from "mongoose";

import { ApiErrorResponse } from "../utils/ApiErrorResponse.js";

const errorHandler = (err, req, res, next)=>{
    let error = err


    if(!(error instanceof ApiErrorResponse)){
        const statusCode = error.statusCode || error instanceof
        mongoose.Error ? 400 : 500

        const message = error.message || "Something went wrong"
        error = new ApiErrorResponse(statusCode, message, error?.errors || [], err.stack)
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? {stack: error.stack} : {}) 
    }

    return res.status(error.statusCode).json(response)
}

export { errorHandler };