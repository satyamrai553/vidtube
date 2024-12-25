import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiErrorResponse(400, "Vidoe id required");
    }
    


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const { content } =req.body;
    if(!content){
        throw new ApiErrorResponse(400, "comment is required!");
    }
    const user = req.user._id;
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrorResponse(400, "Vidoe not found!");
    }

    const comment = await Comment.create({
        content,
        video: video,
        owner: user,
    })

    if(!comment){
        throw new ApiErrorResponse(500, "Error while adding comment");
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment added successfully")
    )
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content} = req.body;
    if(!content){
        throw new ApiErrorResponse(400, "Comment content is required");
    }


    const {commentId} = req.params;
    const user = req.user._id;
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiErrorResponse(400, "Comment not found");
    }
    if(comment.owenr !== user){
        throw new ApiErrorResponse(400, "Unauthorized request");
    }

    const updateComment = await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content,
        },
        
    },
    {new: true}
);
    if(!updateComment){
        throw new ApiErrorResponse(500, "Error while updating the comment");
    }
    return res.status(200).json(
        new ApiResponse(200, updateComment, "Comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
   
    const {commentId} = req.params;
    const user = req.user._id;
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiErrorResponse(404,"Comment does not exist");
    }
    if(comment.owner !== owner){
        throw new ApiErrorResponse(404, "Unauthorized request")
    }

    const deleteComment =await Comment.findByIdAndDelete(commentId);
    if(!deleteComment){
        throw new ApiErrorResponse(500, "Error occur while deleting the comment");
    }

    return res.status(200).json(
        new ApiResponse(200,deleteComment,"Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
