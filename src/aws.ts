import {S3Client, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import dotenv from "dotenv"
dotenv.config()

import express from "express"
const app = express.Router()

const s3 = new S3Client({
  region:process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY ,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
}); 
app.post("/get-presigned-url-s3",async(req,res) =>{
  try {
    const command = new PutObjectCommand({
      Bucket: "chat-app-bucket47", 
      Key: `profile-pictures/${Date.now()}-${"profile-image"}`,
      ContentType: "jpeg",
    });
  
    const url =  await getSignedUrl(s3, command, { expiresIn: 60 });  
    res.status(200).json({
      url
    })
  } catch (error) {
    res.status(500).json({
      message:"Internal server error"
    })
  }
})

export default app
