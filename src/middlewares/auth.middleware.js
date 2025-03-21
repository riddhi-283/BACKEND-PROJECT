import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token  = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        // if token is not there
        if(!token) throw new apiError(401, "Unauthorized request!!")
        
        // if token is there, we have to verify if the token is correct or not using jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password refreshToken")
    
        if(!user) throw new apiError(401, "Invalid Acess Token")
        
        req.user = user
        next()
    
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Access Token!!")
    }
})
