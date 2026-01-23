import {z} from "zod"


export const singnUpSchema = z.object({
    name:z.string().min(3,{message:"Name must be at least 3 characters long"})
    .nonempty({message:"name is required"}),
    email:z.string().min(11,{message:"Email must be at least % Characters long"}),
    password:z.string().min(6,{message:"password must be 6 characters long"})
})