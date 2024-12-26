import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"
import fs from 'fs'


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(videoLocalPath){
        throw new ApiErrorResponse(400, "Video file is missing")
    }
    if(!thumbnailLocalPath){
        throw new ApiErrorResponse(400, "Thumbnail is required")
    }

    const { title, description} = req.body

    if(!title || !description){
       fs.unlinkSync(videoLocalPath)
       fs.unlinkSync(thumbnailLocalPath)
        throw new ApiErrorResponse(404, "Both fields are required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if(!videoFile.url){
        throw new ApiErrorResponse(500, "Error while uplaoding the video")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    
    if(!thumbnail.url){
        throw new ApiErrorResponse(500, "Error while uplaoding the thumbnail")
    }

    const video = await Video.create({
        title: title,
        description: description || "",
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user._id
    })

    if(!video){
        throw new ApiErrorResponse(500, "Error while save to database")
    }
    return res.status(200).json(
        new ApiResponse(200, "Video published successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}