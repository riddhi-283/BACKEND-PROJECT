// way-1// async handler fn using try-catch
// const asyncHandler = (fn) => async (req,res,next) => {
//    try {
//       await fn(req,res,next)
//    } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,
//         message: err.message
//     })
//    }
// }
// export {asyncHandler}

//way-2// async handler fn using promise
const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}
export {asyncHandler}
