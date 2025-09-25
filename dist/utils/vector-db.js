"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfoFromCollection = exports.createCollection = void 0;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const genai_1 = require("@google/genai");
const client = new js_client_rest_1.QdrantClient({
    url: process.env.VECTOR_DB_URL_QUADRANT,
    apiKey: process.env.VECTOR_DB_QUADRANT_API_KEY
});
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const infoForEmbedding = [
    {
        payload: {
            field: "qualification",
            value: "B.Tech graduate",
            category: "education",
            text: "qaulification what is your studies  "
        }
    },
    {
        payload: {
            field: "experience",
            value: "1 years in fullstack development",
            category: "career",
            text: "experience how much experience do you have "
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
    }
];
function createEmbeddings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield ai.models.embedContent({
                model: "gemini-embedding-001",
                contents: infoForEmbedding.map(val => val.payload.text),
                config: {
                    outputDimensionality: 768,
                    taskType: "retrieval_document"
                }
            });
            if (!(response === null || response === void 0 ? void 0 : response.embeddings)) {
                console.log("text not embedded from llm");
                return;
            }
            const embeddedText = response === null || response === void 0 ? void 0 : response.embeddings;
            const operationInfo = yield client.upsert("dilip_collection", {
                wait: true,
                points: infoForEmbedding.map((val, index) => {
                    return { id: index, vector: embeddedText[index].values, payload: val.payload };
                })
            });
            console.debug("storing points in vector db", operationInfo);
        }
        catch (error) {
            console.log("error in embedding info", error);
        }
    });
}
//  createEmbeddings()
const getCollection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield client.getCollections();
        console.log('List of collections:', result.collections);
    }
    catch (err) {
        console.error('Could not get collections:', err);
    }
});
// getCollection() 
const createCollection = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("here");
    try {
        const response = yield client.createCollection("dilip_collection", {
            vectors: { size: 768, distance: "Cosine" }
        });
        console.log("from create collection", response);
    }
    catch (error) {
        console.log(error);
    }
});
exports.createCollection = createCollection;
// createCollection()
const getInfoFromCollection = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("query", query);
        const getEmbeddedFromQuery = yield ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: query,
            config: {
                outputDimensionality: 768,
                taskType: "retrieval_document"
            }
        });
        if (!getEmbeddedFromQuery.embeddings) {
            console.log("issue in getting query embedded");
            return;
        }
        const emdeddedContent = (_a = getEmbeddedFromQuery === null || getEmbeddedFromQuery === void 0 ? void 0 : getEmbeddedFromQuery.embeddings[0]) === null || _a === void 0 ? void 0 : _a.values;
        if (emdeddedContent) {
            let searchResult = yield client.query("dilip_collection", {
                query: [...emdeddedContent],
                limit: 3,
                with_payload: true
            });
            if (!searchResult.points) {
                console.log("no info retrieve from collection ");
                return;
            }
            const retrievalData = searchResult.points.map((data) => { var _a; return (_a = data.payload) === null || _a === void 0 ? void 0 : _a.value; });
            return retrievalData;
        }
        return null;
    }
    catch (error) {
        console.log("error  in getting info from vector db ", error);
    }
});
exports.getInfoFromCollection = getInfoFromCollection;
// getInfoFromCollection("waht is your qaulification ?")
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LZOkAj2ezLJCJSAtKHw6ub71n3tVMvL2NQ1O007gaik
