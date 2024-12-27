import { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content){
        throw new ApiErrorResponse(400, "Content field is required")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })
    if(!tweet){
        throw new ApiErrorResponse(500, "Error while creating a tweet")
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully!")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiErrorResponse(400, "Invalid user ID")
    }
    const tweet = await Tweet.find({owner: userId}).sort({createdAt: -1})

    if(tweet.length == 0){
        throw new ApiErrorResponse(400, "No tweet found")
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "All tweet fetched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiErrorResponse(400, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiErrorResponse(404, "Video not found!")
    }
    if(tweet.owner != req.user._id){
        throw new ApiErrorResponse(401, "Unathorized user request")
    }
    const {content} = req.body
    if(!content){
        throw new ApiErrorResponse(400, "Content is required")
    }
    const newTweet = await Tweet.findByIdAndUpdate(userId,
        {
           $set:{
            content: content
           } 
        },
        {
            new: true
        }
    )
    if(!newTweet){
        throw new ApiErrorResponse(500, "Error while updating the request")
    }
    return res.status(200).json(
        new ApiResponse(200, newTweet, "Tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiErrorResponse(400, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiErrorResponse(404, "Video not found!")
    }
    if(tweet.owner != req.user._id){
        throw new ApiErrorResponse(401, "Unathorized user request")
    }
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deleteTweet){
        throw new ApiErrorResponse(500, "Error while deleting the tweet")
    }
    return res.status(200).json(
        new ApiResponse(200, deleteTweet, "Tweet deleted successfully")
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}