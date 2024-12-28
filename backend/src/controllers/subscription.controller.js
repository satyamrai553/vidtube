import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  const subscribed = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: req.user._id }],
  });
  if (!subscribed) {
    const subscribe = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!subscribe) {
      throw new ApiError(500, "Error while Subscribing");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, subscribe, "Channel Subscribed"));
  }

  const unsubscribe = await Subscription.findByIdAndDelete(subscribed._id);
  if (!unsubscribe) {
    throw new ApiError(500, "Error while Unsubscribing");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Channel Unsubscribed"));


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiErrorResponse(400, "Invalid channel ID");
    }

    
    const subscribersList = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber: {
                    $first: "$subscriber",
                }
            }
        },
        {
            $project:{
                subscriber: 1,
                createdAt: 1,
            }
        }
    ])
    if(!subscribersList){
        throw new ApiErrorResponse(400, "Error while fetching the list")
    }
     

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiErrorResponse(400, "Invalid subscriber ID");
    }
    const channelsList = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"user",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
            }
        },
        {
            $addFields: {
                channel: {
                  $first: "$channel",
                },
            }
        },
        {
            $project: {
                channel: 1,
                createdAt: 1,
              },
        }
    ])
   
    if (!channelsList || channelsList.length === 0) {
        throw new ApiErrorResponse(404, "No subscribed channels found for this subscriber");
    }

    // Return response
    return res
        .status(200)
        .json(new ApiResponse(200, channels, "Channels fetched successfully"));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}