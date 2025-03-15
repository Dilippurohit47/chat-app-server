import {S3Client, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import dotenv from "dotenv"
dotenv.config()
const s3 = new S3Client({
    region:process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY ,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  }); 
  export const generateUrl = async (fileName, fileType) => {
    const command = new PutObjectCommand({
      Bucket: "chat-app-bucket47", 
      Key: `profile-pictures/${Date.now()}-${"first-upload"}`,
      ContentType: "jpeg",
    });
  
    const url =  await getSignedUrl(s3, command, { expiresIn: 60 });  
    console.log(url)
    return url;
  };

console.log(generateUrl())
