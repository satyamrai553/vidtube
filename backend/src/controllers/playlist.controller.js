import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description){
        throw new ApiErrorResponse(400, "Both fields are required")
    }
    const playlist = await Playlist.create({
        owner: req.user._id,
        name,
        description,
    })

    if(!playlist){
        throw new ApiErrorResponse(500, "Error while creating the playlist")
    }
    return res.status(200).json(
        new ApiResponse(200, "Playlist created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

 
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiErrorResponse(400, "Invalid user ID");
    }

   
    if (userId !== req.user._id.toString()) {
        throw new ApiErrorResponse(401, "Unauthorized user request");
    }

  
    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId), // Match playlists for the user
            },
        },
        {
            $lookup: {
                from: "videos", // Collection name for videos
                localField: "videos", // Playlist's videos array field
                foreignField: "_id", // Video's _id field
                as: "videos", // Output array of videos
            },
        },
        {
            $addFields: {
                thumbnail: { $arrayElemAt: ["$videos.thumbnail", 0] }, // Thumbnail of the first video
                videoCount: { $size: "$videos" }, // Total number of videos
            },
        },
        {
            $project: {
                name: 1, // Playlist title
                owner: 1, // Playlist owner
                description: 1,
                thumbnail: 1, // Thumbnail of the first video
                videoCount: 1, // Total number of videos
            },
        },
    ]);

    if (!userPlaylists.length) {
        throw new ApiErrorResponse(404, "No playlists found for this user");
    }

   return  res.status(200).json(
    new ApiResponse(200, userPlaylists,"Playlist fetched successfully")
   );

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiErrorResponse(400, "Invalid playlist ID")
    }
       // Validate the playlistId
       if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiErrorResponse(400, "Invalid playlist ID");
    }

    // Fetch the playlist and ensure the user owns it
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "users", // Collection name for users
                localField: "owner", // Owner field in Playlist
                foreignField: "_id", // User's _id field
                as: "owner",
            },
        },
        {
            $unwind: "$owner", // Flatten owner array
        },
        {
            $lookup: {
                from: "videos", // Collection name for videos
                localField: "videos", // Playlist's videos array
                foreignField: "_id", // Video's _id field
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Collection name for users
                            localField: "owner", // Owner field in Video
                            foreignField: "_id", // User's _id field
                            as: "owner",
                        },
                    },
                    {
                        $unwind: "$owner", // Flatten owner array
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            createdAt: 1,
                            description: 1,
                            owner: {
                                username: "$owner.username",
                            },
                        },
                    },
                ],
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                videos: 1,
                owner: {
                    username: "$owner.username",
                },
            },
        },
    ]);

    if (!playlist || playlist.length === 0) {
        throw new ApiErrorResponse(404, "Playlist not found");
    }

    // Ensure the logged-in user is the owner of the playlist
    if (playlist[0].owner.username !== req.user.username) {
        throw new ApiErrorResponse(401, "Unauthorized user request");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Plalist fetched successfully")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
   


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}