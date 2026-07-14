import {QdrantClient} from '@qdrant/js-client-rest';
import { GoogleGenAI } from "@google/genai";
// import { infoForEmbedding } from '../../utils/ownerInfoForVd';

const client = new QdrantClient({
    url: process.env.VECTOR_DB_URL_QUADRANT,
    apiKey:process.env.VECTOR_DB_QUADRANT_API_KEY
});



    const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});



    const infoForEmbedding = []






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

// createEmbeddings()


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



// getInfoFromCollection("best skills")







