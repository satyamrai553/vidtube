import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"
import fs from 'fs'
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (videoLocalPath) {
        throw new ApiErrorResponse(400, "Video file is missing")
    }
    if (!thumbnailLocalPath) {
        throw new ApiErrorResponse(400, "Thumbnail is required")
    }

    const { title, description } = req.body

    if (!title || !description) {
        fs.unlinkSync(videoLocalPath)
        fs.unlinkSync(thumbnailLocalPath)
        throw new ApiErrorResponse(404, "Both fields are required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if (!videoFile.url) {
        throw new ApiErrorResponse(500, "Error while uplaoding the video")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)


    if (!thumbnail.url) {
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

    if (!video) {
        throw new ApiErrorResponse(500, "Error while save to database")
    }
    return res.status(200).json(
        new ApiResponse(200, "Video published successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiErrorResponse(400, "Not a valid Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiErrorResponse(400, "Video not found!")
    }
    return res.status(200).ApiResponse(200, video, "Video fetched successfully")


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiErrorResponse(400, "Not a valid Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }

    if(video.owner != req.user._id){
        throw new ApiErrorResponse(401, "Unathorized user request")
    }

    const thumbnailLocalPath = file?.path;

    const { title, description } = req.body;

    if (!thumbnailLocalPath && !title && !description) {
        throw new ApiErrorResponse(400, "Altleast one field is required")
    }
    const updates = {};

    const thumbnail = upload(thumbnailLocalPath);


    if (thumbnail) {
        updates.thumbnail = thumbnailLocalPath;
    }
    if (title) {
        updates.title = title;
    }
    if (description) {
        updates.description = description;
    }

    const updatedVideo = await video.findByIdAndUpdate(videoId, {
        $set: updates
    },
        {
            new: true
        })



    if (!updatedVideo) {
        throw new ApiErrorResponse(500, "Error whole updating the detai")
    }
    return res.satatus(200).json(
        new ApiResponse(200,updatedVideo, "Video details updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiErrorResponse(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video Not Found");
      }
    if(video.owner != req.user._id){
        throw new ApiErrorResponse(401, "Unathorized user request")
    }
    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if(!deleteVideo){
        throw new ApiErrorResponse(500, "Error while deleting the video")
    }
    return res.status(200).json(
         new ApiResponse(200, deleteVideo, "Video deleted Successfully")
    )


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiErrorResponse(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video Not Found");
      }
    if(video.owner != req.user._id){
        throw new ApiErrorResponse(401, "Unathorized user request")
    }
    const publishStatus = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished: !video.isPublished
            }
        },
        {
            new: true
        }
    )
    if(!publishStatus){
        throw new ApiErrorResponse(500, "Error while updating the status")
    }

    return res.satatus(200).json(
        new ApiResponse(200, publishStatus, "Publish status updated successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}