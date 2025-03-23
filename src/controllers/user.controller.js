import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        // NOTE: accessToken is given to user and refreshToken is saved in database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})   // when.save is called mongoose model kick in like password field gets kick in (saying password must be there), validateBeforeSave = false is used for that (means no need to validate anything directly save)

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500,"Something went wrong while generating access and refresh tokens!!")
    }
}

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
   // check-1 // if any data feilds are empty
   if(
    [fullname, email, username, password].some((field) => 
     field?.trim() === "")   // agar field hai to trim it, or trim ke baad if is empty then return true, and even if one field is empty then it returns true
   ) {
    throw new apiError(400,"All fields are required!")
   }
   
   // check-2// if already exists
   const existedUser = await User.findOne({
    $or: [{username},{email}]
   })
   if(existedUser) throw new apiError(409,"User with this email or username already exists!")

    // console.log(req.files);   // only to learn
   
   
    // check-3// find localpath of avatar & check if its uploaded or not 
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path    
    // 1 -- withouting checking any condition on coverImage

    if(!avatarLocalPath) throw new apiError(400,"Avatar file is required!")
    
    // 2---checking condition for cover image: if coverimage is not uploaded then it shows "undefined" for coverImage field, and throws an error so to handle this:
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    } 
    //now because of this, even when no coverimage is there there is no error

    // upload them to cloudinary - await because the code below shouldn't run before upload is completetd and also becuase upload takes time that is why we used async in uploadOnCloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // checking if avatar has gone to cloudinary or not
    if(!avatar) throw new apiError(400,"Avatar file is required!")

    // make an object and make an entry in db - ek hi cheez hai jo database se baat kr rhi h which is User, that is why User.create is used
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

const loginUser = asyncHandler(async( req,res) => {
    //1 get data from req.body
    //2 ask for username or email for login
    //3 find the user
    //4 password check
    //5 access and refresh token generation
    //6 send these tokens in form of secure cookies
    //7 response given to user if he has succesfully logged in or not

    const {email, username, password} = req.body
    console.log(email)

    // check if username and email both are provided 
    if(!username && !email) throw new apiError(400,"Username or email required for login!!")

    // if(!(username || email))  -- if you want to find by any one of them and not both then simply do this
    // either search for email or username
    const user = await User.findOne({
        $or:[{username, email}]
    })
    // user not registered 
    if(!user) throw new apiError(404, "User does not exist!!")
    
    // if user is there, check password - we will make use of the password checking method - isPasswordCorrect(from users.models.js), but since these are our own made methods so we will use user instance and not User (for mongodb methods like findOne etc we can use User)
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new apiError(401, "Invalid password")

    // generate access token n refresh token
    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)
    
    // send tokens into cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  // Question: why we have to again retrieve user??
    // Answer: the user we retrived earlier using findOne fn had all data (even password) but refreshtoken value was empty becase generataccessandrefreshtoken fn is called after that, so the retrived user instance has no value for refreshtoken but knows password which is wrong , so we have two options:
    // ---opt 1) update the refreshtoken value for that user object
    // ---opt 2) make another db query(if its not expensive) and retrive user again, becayse till now refreshtoken value has already been updated in db, so this time the retrieved user object will have value for refreshtoken field.

    const options = {
        httpOnly: true,  // setting httopnly and secure as true ensures that cookies are only modifiable from server not from frontend
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            " User logged in successfully!"
        )
    )

})

// logout functionality
// Ques: why does logout requires middleware?
// We dont have access to _id or any field of usser for this fn (if we want access we again have to run findOne method, also we cant durectly ask user to enter an email for which logout has to happen as he may enter any email and someone else logsout because of that) ->solution: use a middleware
const logoutUser = asyncHandler(async(req,res) => {
    // clear cookies
    // delete refreshToken

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :{
                refreshToken:1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,  // setting httopnly and secure as true ensures that cookies are only modifiable from server not from frontend
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out!!"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
   const incomingRefreshToken = req.cookies.refreshToken 
   || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new apiError(401, "Unauthorized request!!")
   }

   // verify incomingRefreshToken
   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET,
    )
 
    const user = await User.findById(decodedToken?._id)
    if(!user) throw new apiError(401,"Invalid refresh token!!")
 
    // match if incoming token which is sent by user is matching with original token user had
    if(incomingRefreshToken !== user?.refreshToken){
     throw new apiError(401, "Refresh token is expired or used")
    }
 
    const options = {
     httpOnly:true,
     secure:true
    }
 
    const {accessToken, newrefreshToken} = await generateAccessandRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
     new apiResponse(
         200,
         {accessToken, refreshToken:newrefreshToken},
         "Access token refreshed!"
     )
    )
   
   } catch (error) {
     throw new apiError(401, error?.message || 
        "Invalid refresh token"
     )
   }


   
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    // what do we want to take from user:
    const {oldPassword, newPassword} = req.body

    // to change the password of a user, we first need to have access of user. if a user is able to change his password then it means he is logged in clearly, that means middleware chala hai so req.user se user to hai apne paas
    const user = await User.findById(req.user?._id)

    // first check if old password is corrct or not
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) throw new apiError(401, "Incorrect old password!!")

    // set new password
    user.password = newPassword   // ->this goes to userSchema.pre("save",..) method, if newpassword is same as prevously stored (old) password, then simply go to next, but if not then this new password will get bcrypted
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully!"))

})

const getCurrentUser =  asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully!")
})

// we can make functions for updating other details as well
const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new apiError(400, "All fields are required!")
    }
    // find user first 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email,

            }
        },
        {new:true} // new=true means after updation new user (user with updated info) will be returned to us
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated sucessfully!"))
})

// updating files  - 2 middlewares have to be used (multer, because files will be accepted using that only, second only those can access who are logged in)

const updateUserAvatar = asyncHandler(async(req,res) => {
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath) throw new apiError(400,"Avatar file is missing!!")
   
   // upload avatar local path on cloudnary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url) throw new apiError(400,"Error while uploading avatar!!")

   // update avatar
   const user  = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar : avatar.url
        }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new apiResponse(200, user, "Avatar updated successfully!!"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) throw new apiError(400,"CoverImage file is missing!!")
    
    // upload avatar local path on cloudnary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url) throw new apiError(400,"Error while uploading coverImage!!")
 
    // update avatar
    const user = await User.findByIdAndUpdate(
     req.user?._id,
     {
         $set:{
            coverImage : coverImage.url
         }
     },
     {new: true}
    ).select("-password")

    return res
   .status(200)
   .json(new apiResponse(200, user, "CoverImage updated successfully!!"))
 })


const getUserChannelProfile = asyncHandler(async(req,res) => {
  // in order to go any channel's profile, we need to go to url of that channel
  const {username} = req.params
  if(!username?.trim()) throw new apiError(400, "username is missing!!")
  
  const channel = await User.aggregate([
    // match a user
    {
        $match:{
            username: username?.toLowerCase()
        }
    },

    // lookup for counting number of subscibers for a field
    {
        $lookup:{
            from:"subscriptions",   // from subscription.model.js, imported model was "Subscription" but in mongodb it will be saved as "subscriptions" so written that in "from" value
            localField:"_id",
            foreignField:"channel",
            as:"susbcribers"
        }
    },

    // lookup for finding how many channels have i subscribed
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"

        }
    },
    // add these fields
    {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            // to handle frontend to show that "subsribed or not" red button
            isSubscribed:{
                $cond:{
                    // check ki jo document aaya h subscribers usme me hu ya nahi
                    if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                    then:true,
                    else:false
                    // means "subscribers" field me "subscriber" (subscribers field has subscriber, check subscription.model.js) ke andr jaake dekh lo ki req.user._id hai ya nahi
                }
            }
        }
    },
    {   
        // jis jis cheez ko pass on karna use value denge 1
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,

        }
    }

])

  if(!channel?.length) {
    throw new apiError(404, "channel does not exist!")
  }
  return res
  .status(200)
  .json(new apiResponse(200,channel[0], "User channel fetched successfully!"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage
}