import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
      }
      const user = req.user._id;
      const likedVideo = await Like.findOne({
        $and: [{ video: videoId }, { likedBy: user }],
      });
    
      if (!videoLike) {
        const like = await Like.create({
          video: videoId,
          likedBy: user,
        });
    
        if (!like) {
          throw new ApiError(500, "Error while liking the video");
        }
    
        return res
          .status(200)
          .json(new ApiResponse(200, like, "User Liked the video"));
      }
    
      const unlikeVideo = await Like.findByIdAndDelete(likedVideo._id);
      if (!unlikeVideo) {
        throw new ApiError(500, "Error while unliking the video");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, unlikeVideo, "User Unliked the video"));
    

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiErrorResponse(400, "Invalid commend ID")
    }
    const user = req.user._id;
    const likedComment = await Comment.findOne({
        $and : [{comment: commentId}, {likedBy: user}]
    })

    if(!likedComment){
        const like = await Like.create({
            comment: commentId,
            likedBy: user,
        });
        if (!like) {
            throw new ApiError(500, "Error while liking the Comment")
          }
      
          return res
            .status(200)
            .json(new ApiResponse(200, like, "User Liked the comment"));

    }

    const unlikeComment = await Like.findByIdAndDelete(likedComment._id);
    if (!unlikeComment) {
      throw new ApiError(500, "Error while unliking the video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, unlikeComment, "User Unliked the video"));


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const user = req.user._id;
  const likeTweet = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: user }],
  });
  if (!likeTweet) {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: user,
    });
    if (!like) {
      throw new ApiError(500, "Error while Liking the Tweet");
    }
    return res.status(200).json(new ApiResponse(200, like, "Tweet Liked"));
  }
  const unlikeTweet = await Like.findByIdAndDelete(likeTweet._id);
  if (!unlikeTweet) {
    throw new ApiError(500, "Error while unliking the Tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, unlikeTweet, "Tweet Unliked"));
    
})

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