import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler(async(req, res) => {
    // steps -1) get user details from frontend  - no need to make frontend for this, data can be taken from postman
    // 2) validations (user details not empty)
    // 3) check if user already exist: using username and email, so that no one registers more than once
    // 4) check for images and avatar
    // 5) if present, upload them to cloudinary, check avatar is uploaded on cloudinary or not
    // 6) create user object - create an entry in mongodb db
    // 7) remove password and refresh token field from response
    // 8) check for user creation -> if yes return response or else return error

    //1) if data is coming from json/form then req.body can be used to retriev data
   const {fullname, email, username, password} = req.body
    //  console.log([fullname, email, username, password]);   // only to check if everything is working fine or not
   
   // one way is make all checks like the below one - perfectly fine but long code then
   // if(fullname === "") throw new apiError(400, "FullName is required!")
   
   // another better way 
   // check-1 // if empty
   if(
    [fullname, email, username, password].some((field) => 
     field?.trim() === "")   // agar field hai to trim it, or trim ke baad if is empty then return true, and even if one field is empty then it returns true
   ) {
    throw new apiError(400,"All fields are required!")
   }
   
   // check-2// if already exists
   const existedUser = User.findOne({
    $or: [{username},{email}]
   })
   if(existedUser) throw new apiError(409,"User with this email or username already exists!")
   
    // check-3// check if avatar uploaded or not
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) throw new apiError(400,"Avatar file is required!")

    // upload them to cloudinary - await because the code below shouldn't run before upload is completetd and also becuase upload takes time that is why we used async in uploadOnCloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // checking if avatar has gone to cloudinary or not
    if(!avatar) throw new apiError(400,"Avatar file is required!")

    // make an object and make an entry in db - ek hi cheez hai jo database se baat kr rhi h which is User
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "" ,   //becuase unlike avatar, we havent checked if coverimage is there or not earlier in code, and since its not necessary so we did not throw an error
        email,
        password,
        username:username.toLowerCase()
})

// check if user is made or not : way - whenever a user is created mongodb automatically adds a field _id to it, so we try to find the value of _id field of created user, if we get it means user has been created successfully  ++++++
// remove password and refresh token - basically we have unselected these two things from the response 
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser) throw new apiError(500, "Something went wrong while registering the user!!")

// return the response
return res.status(201).json(
    new apiResponse(200, createdUser, "User registered successfully!!")
)
  
})

export {
    registerUser,
}