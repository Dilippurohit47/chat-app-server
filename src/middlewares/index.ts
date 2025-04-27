import JWT from "jsonwebtoken"
export const authorizeToken =(req,res,next) =>{
try {
    const token = req.cookies["chat-token"]
    if(!token){
        res.status(404).json({
            message:"Login First"
        })
    }
   const user =  JWT.verify(token , process.env.JWT_SECRET!)
console.log(user)
   req.user = user
   next()
} catch (error) {
    console.log(error)
     res.status(403).json({
        message:"Invalid Token"
    })
    return
}  
}