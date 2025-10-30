import express from "express"
import { prisma } from "../utils/prisma"

const app = express.Router()

app.get("/get-public-key/:id",async(req,res) =>{
    try {
        const id= req.params.id as string
        const user = await prisma.user.findUnique({
            where:{
                id:id
            },
            select:{
                publickey:true
            }
        })
        if(!user){
            res.status(403).json({
                message:"User not found"
            })
            return
        }
        res.json(user)
    } catch (error) {
        console.log("Error in getting user",error)
        
        res.status(500).json({
            message:"Internal server error"
        })
        
    }

})


export default app