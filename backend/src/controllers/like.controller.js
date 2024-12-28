import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    
    

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    if(!isValidObjectId(userId)){
        throw new ApiErrorResponse(400, "User ID is not valid")
    }
      // Fetch liked videos
      const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId), // Filter likes by user
            },
        },
        {
            $lookup: {
                from: "videos", // Collection name for videos
                localField: "video", // Liked video's ID field
                foreignField: "_id", // Video's _id field
                as: "video", // Output array field
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Collection name for users
                            localField: "owner", // Owner of the video
                            foreignField: "_id", // User's _id field
                            as: "owner", // Output array for owner details
                            pipeline: [
                                {
                                    $project: {
                                        username: 1, // Include username only
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: "$owner", // Flatten the owner array
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            createdAt: 1,
                            owner: "$owner.username", // Include only the owner's username
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$video", // Flatten the video array
        },
        {
            $project: {
                video: 1, // Include video details
            },
        },
    ]);

    if(!likedVideos || likedVideos.length == 0){
        throw new ApiErrorResponse(404, "No liked Video found")
    }


    res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});
    


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}