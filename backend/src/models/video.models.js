import mongoose, {Schema} from "mongoose";


const videoSchema = new Schema({
    videoFile:{
        type: String,
        required: true
    },
    thumabnial:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
    },
    views:{
        type: Number,
        default: 0
    },
    duration:{
        type: Number,
        required: true
    },
    isPublished:{
       type: Boolean,
       default: true 
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps: true
})

export const Video = mongoose.model("Video", videoSchema)