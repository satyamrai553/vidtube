import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrorResponse} from "../utils/ApiErrorResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import  jwt  from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiErrorResponse(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
   const {fullname, email, username, password} = req.body;
    console.log(email,password)
    //validation
    if([fullname, username, email, password].some((field)=> field?.trim() === "" )){
        throw new ApiErrorResponse(400, "All fields are required")
    }
    //cheack if user already exist
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiErrorResponse(409, "User with email or username already exists")

    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiErrorResponse(400, "Avatar file is missing")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiErrorResponse(400, "Avatar file is required")
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


const loginUser = asyncHandler(async (req, res)=>{
    //get details from the body

    const { email, username, password } = req.body
    
    //check the details for empty 
    if(!username && !email){
        throw new ApiErrorResponse(400, "username or email is required")
    }


    //check username and password in database
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiErrorResponse(404, "No user found with the provided email or username");

    }
    
    const isPasswordVaild = await user.isPasswordCorrect(password)

   if(!isPasswordVaild){
    throw new ApiErrorResponse(401, "The password you entered is incorrect");

   }

   //create access and refresh token 

   const {accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //return the response

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
          
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json(new ApiErrorResponse(200, {}, "User logged out successfully"))
})


const checkLink = asyncHandler(async(req, res)=>{
    const {email} = req.body;

    console.log(email);
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    //check for refresh token in cookies or body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiErrorResponse(401,"Unathorized request");
    }

  try {
      const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
      throw new ApiErrorResponse(401, "Invalid refresh token");
     }
  
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiErrorResponse(401, "Refresh token is expired or used")
     }
  
     const options ={
      httpOnly: true,
      secure: true
     }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
     return res
     .status(200)
     .cookie('accessToken', accessToken,options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
      new ApiResponse(
          200,
          {accessToken, newRefreshToken},
          "Access token refreshed successfully"
      )
     )
  } catch (error) {
    throw new ApiErrorResponse(401, error?.messge || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await user.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiErrorResponse(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(
        new ApiErrorResponse(200, {}, "Password changed successfully")
    )
})


const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res)=>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiErrorResponse(400, "fullname and email is required")
    }

    User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(200,user, "Account details updated successfully")
    )
});

const updateUserAvatar = asyncHandler(async(req, res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiErrorResponse(400, "Avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiErrorResponse(400, "Error while uploading on avatar")
   }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
        $set: {
            avatar: avatar.url
        }
    },
    {
        new: true
    }

  ).select("-password")
  return res.status(200)
  .json(
   new ApiResponse(200, user, "Avatar image updated successfully")
  )

})
const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
     throw new ApiErrorResponse(400, "Avatar file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverLocalPath)
 
    if(!coverImage.url){
     throw new ApiErrorResponse(400, "Error while uploading on avatar")
    }
 
   const user = await User.findByIdAndUpdate(req.user._id,
     {
         $set: {
            coverImage: coverImage.url
         }
     },
     {
         new: true
     }
 
   ).select("-password")
   return res.status(200)
   .json(
    new ApiResponse(200, user, "Cover image updated successfully")
   )
 })

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}