import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
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

    // Validate the channel ID
    if (!isValidObjectId(channelId)) {
        throw new ApiErrorResponse(400, "Invalid channel ID");
    }

    // Aggregate pipeline to fetch channel subscribers
    const subscribers = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriptions",
            },
        },
        {
            $unwind: {
                path: "$subscriptions",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriptions.subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        {
            $project: {
                username: 1,
                subscriberDetails: {
                    username: 1,
                },
            },
        },
    ]);

    if (!subscribers || subscribers.length === 0) {
        throw new ApiErrorResponse(404, "No subscribers found for this channel");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriber ID
    if (!isValidObjectId(subscriberId)) {
        throw new ApiErrorResponse(400, "Invalid subscriber ID");
    }

    // Aggregate pipeline
    const channels = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $unwind: {
                path: "$subscribedTo",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscribedTo.channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0, // Exclude subscriber ID
                username: "$channelDetails.username",
                avatar: "$channelDetails.avatar",
            },
        },
    ]);

    // Check if any channels were found
    if (!channels || channels.length === 0) {
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