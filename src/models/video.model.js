import mongoose, {mongo, Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema(
   {
       videoFile: {
        type: String ,  // cloudinary url // although mongodb allows us to store images as media files directly but its not a good habit as it creates a lot of load on database
        required:true
       }, 

       thumbnail:{
        type:String, // cloudinary url
        required: true
       }, 
       title:{
        type:String, 
        required: true
       }, 
       description:{
        type:String, 
        required: true
       }, 
       duration:{
        type:Number, // cloudinary url - whenever cloudnary uploads a file, it sends a lot of information about the file such as date, url, etc
        required: true
       }, 
       views:{
        type:Number,
        default:0
       }, 
       isPublished:{
        type: Boolean,
        default:true
       },
       owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
       }


   }, {timestamps : true}
)
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)