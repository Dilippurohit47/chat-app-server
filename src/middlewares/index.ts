import JWT from "jsonwebtoken"
import { Response,Request,NextFunction } from "express"
import dotenv from "dotenv"
dotenv.config()
export const authorizeToken =(req:Request,res:Response,next:NextFunction) =>{
try { 
    const token = req.cookies["chat-token"]
    if(!token){ 
        res.status(404).json({
            message:"Login First"
        })
    }

   const user =  JWT.verify(token , process.env.JWT_SECRET!) 
   if(typeof user === "string"){
    return
   }
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