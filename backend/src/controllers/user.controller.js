import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrorResponse} from "../utils/ApiErrorResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const registerUser = asyncHandler(async (req, res)=>{
   const {fullname, email, username, password} = req.body;

    //validation
    if([fullname, username, email, password].some((field)=> field?.trim() === "" )){
        throw new ApiErrorResponse(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiErrorResponse(409, "User with email or username already exists")

    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverLocalPath = req.files?.coverImage[0]?.path

    if(avatarLocalPath){
        throw new ApiErrorResponse(400, "Avatar file is missing")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    let coverImage = ""

    if(coverLocalPath){
        coverImage = await uploadOnCloudinary(coverImage)
    }

   const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiErrorResponse(500, "Somthing went wrong while registring a user")
    }

    return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registed successfully"))


})



export {
    registerUser
}