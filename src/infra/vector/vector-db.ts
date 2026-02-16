import {QdrantClient} from '@qdrant/js-client-rest';
import { GoogleGenAI } from "@google/genai";

const client = new QdrantClient({
    url: process.env.VECTOR_DB_URL_QUADRANT,
    apiKey:process.env.VECTOR_DB_QUADRANT_API_KEY
});



    const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

const infoForEmbedding = [
  {
    payload: {
      field: "qualification",
      value: "B.Tech graduate",
      category: "education",
      text: "qaulification what is your studies  "
    }
  },{
    payload:{
      field:"Greeting",
      value:"hello I am Fullstack developer how can i help you today" , 
      categorry:"greetings",
      text:"hello Hie good morning  Hy "

    }
  },
  {
    payload: {
      field: "experience",
      value: "1+ years in fullstack development at hostel co ",
      category: "career",
      text: "experience how much experience do you have  "
    }
  },
  {
    payload: {
      field: "skills",
      value: "React, Node.js, Go, postgresql, redis , kafka , docker ",
      category: "skills",
      text: "My skills include React, Node.js, Go, SQL"
    }
  },
  {
    payload: {
      field: "personal-info",
      value: " age 22",
      category: "info",
      text: "age 22"
    }
  },
  {
    payload: {
      field: "Projects",
      value: " One of my best project is chatApp with websockets , redis , pub-sub ,caching ,refresh access token , authentication , online-flag , typing flag ,aws s3 for storage ,group and all other chat functionality ,horizontal scalable visit link :chatapp.com ",
      category: "Best Projects",
      text: "Best project one of my best project project ,Most scalable project ,top  project"
    }
  },
  {
    payload: {
      field: "Projects",
      value: "My other projects are learnEnglish.ai , linkamanager ,sketchbook , Video calling app ,ai image editor ",
      category: "Best Projects",
        text: "other projects, side projects, additional projects",
    }
  },
  {
    payload: {
      field: "Location live",
      value: "I am from rajasthan india  currently living in maharahstra and doing college from gujarat vadodra",
      category: "Loation",
        text: "location live where are you from where u live ",
    }
  },
  {
    payload: {
      field: "College university",
      value: "Pusruing btech from Parul universirty vadodra",
      category: "College",
        text: "college university school",
    }
  },// ✅ Add these to your infoForEmbedding array

// FULL STACK SUMMARY
{
  payload: {
    field: "fullstack-overview",
    value: "I am a full-stack developer experienced in building scalable web apps end-to-end using React, Node.js, Go, PostgreSQL, Redis, WebSockets, Docker and AWS. I can handle frontend, backend, database, deployment, testing and monitoring.",
    category: "skills",
    text: "full stack skills fullstack what stack do you use what technologies do you work with"
  }
},

// FULL STACK SKILLS WITH DEPTH
{
  payload: {
    field: "fullstack-details",
    value: "On the frontend, I work with React, TypeScript, Zustand, Tailwind, Next.js and performance optimizations like lazy loading and memoization. On the backend, I build APIs using Node.js, Express, Go, Prisma ORM and PostgreSQL with Redis caching and WebSocket real-time communication.",
    category: "skills",
    text: "explain your full stack skills frontend backend what frameworks do you use"
  }
},

// BACKEND SKILLS
{
  payload: {
    field: "backend-skills",
    value: "Backend skills include Node.js, Express, Go, REST APIs, WebSockets, authentication systems, JWT refresh-access tokens, RBAC, Redis caching, background jobs, rate limiting and secure production API design.",
    category: "skills",
    text: "backend experience api building nodejs express go rest websockets auth"
  }
},

// DEVOPS SKILLS
{
  payload: {
    field: "devops",
    value: "I have DevOps experience with Docker, Nginx reverse proxy, PM2/Node clustering, GitHub Actions CI/CD pipelines, Ubuntu VPS setup, domain + SSL setup, log monitoring, and horizontal scaling using Redis Pub/Sub.",
    category: "devops",
    text: "devops skills deployment docker ci cd github actions server vps nginx reverse proxy"
  }
},

// DEPLOYMENT EXPERIENCE
{
  payload: {
    field: "deployment",
    value: "I deploy apps on cloud VPS (Ubuntu) with Docker containers, Nginx reverse proxy, Let's Encrypt SSL, PostgreSQL database hosting, Redis caching and automated zero-downtime updates using GitHub Actions.",
    category: "devops",
    text: "how do you deploy apps where do you host production deployment pipeline"
  }
},

// INTERNSHIP
{
  payload: {
    field: "internship",
    value: "I worked as a full-stack developer intern at HostelCo where I built a real-time hostel booking system with live availability, PostgreSQL schema design, caching, admin panel, WebSocket notifications and S3 image uploads.",
    category: "internship",
    text: "internship where did you work what did you do in internship hostelco role"
  }
},

// INTERNSHIP TECHNICAL DETAILS
{
  payload: {
    field: "internship-details",
    value: "During my internship I implemented role-based authentication, Redis caching layer, booking conflict prevention logic, automated backups, and API performance improvements that reduced query time by 70%.",
    category: "internship",
    text: "explain your internship responsibilities achievements tasks what you built"
  }
}

];





async function  createEmbeddings() {
try {
      const response = await ai.models.embedContent({
  model: "gemini-embedding-001",
 contents: infoForEmbedding.map(val => val.payload.text),
  config:{
    outputDimensionality:768,
    taskType:"retrieval_document"
  } 

});
if(!response?.embeddings){
  console.log("text not embedded from llm")
  return
}
const embeddedText = response?.embeddings

const operationInfo = await client.upsert("dilip_collection", {
  wait: true,
  points: infoForEmbedding.map((val,index) =>{
    return { id: index, vector: embeddedText[index].values, payload: val.payload }
  })
});


console.debug("storing points in vector db",operationInfo);

} catch (error) {
    console.log("error in embedding info",error)
}
}

//  ecreateEmbeddings()


const getCollection = async() =>{
    try {
    const result = await client.getCollections();
    console.log('List of collections:', result.collections);
} catch (err) {
    console.error('Could not get collections:', err);
}
}
// getCollection() 
export const createCollection = async() =>{
        console.log("here")

    try {
        const response = await client.createCollection("dilip_collection", {
 vectors: { size: 768, distance: "Cosine" }
});

console.log("from create collection",response)
        
    } catch (error) {
        console.log(error)
    }
}

// createCollection()



export const getInfoFromCollection = async(query:string) =>{
    try {
        const getEmbeddedFromQuery = await ai.models.embedContent({
            model:"gemini-embedding-001",
            contents:query,
            config:{
                outputDimensionality:768,
                taskType:"retrieval_document"
            }
        
        })
        if(!getEmbeddedFromQuery.embeddings){
            console.log("issue in getting query embedded")
            return
        }
        
        const emdeddedContent = getEmbeddedFromQuery?.embeddings[0]?.values
        if(emdeddedContent){
            let searchResult = await client.query(
    "dilip_collection", {
    query: [...emdeddedContent],
    limit: 3,
    with_payload:true
});
if(!searchResult.points){
  console.log("no info retrieve from collection ")
  return 
}

const retrievalData = searchResult.points.map((data) => data.payload?.value)

return retrievalData
        }
        return null
    } catch (error) {
        console.log("error  in getting info from vector db ",error)
    }
}

// getInfoFromCollection("waht is your qaulification ?")










// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LZOkAj2ezLJCJSAtKHw6ub71n3tVMvL2NQ1O007gaik