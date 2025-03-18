// to keep of track of watch history of user, we will push the ids of videos watched by user in the watchHistory array
import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index:true   // if we want to make a field searchable in an optimised way then make index=true
    }, 
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
    }, 
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true   // if we want to make a field searchable in an optimised way then make index=true
    }, 
    avatar:{
        type:String,  // cloudinary url
        required:true
    }, 
    coverImage:{
        type:String, // cloudinary url
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required!'],
    },
    refreshToken:{
        type:String
    } 
 }, {timestamps:true}   // this will automatically give us createdAt and updatedAt
)

// everytime before data is saved( or user clicks on save button), everytime it will change(crypt) the password, so even if user changes its avator, it changes the password, but we dont want that, we want password change/encryption to happn only when user changes the password
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next  // if password is not changed then move to next, no encryption

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// using this Schema.methods we can make our own functions
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken  = function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken  = function() {
    return jwt.sign(
        {
            _id:this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)
