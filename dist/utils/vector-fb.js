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
const js_client_rest_1 = require("@qdrant/js-client-rest");
const client = new js_client_rest_1.QdrantClient({
    url: 'https://bca13851-a8d2-4bf5-861d-829a096fc26c.eu-west-2-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LZOkAj2ezLJCJSAtKHw6ub71n3tVMvL2NQ1O007gaik',
});
const getCollection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield client.getCollections();
        console.log('List of collections:', result.collections);
    }
    catch (err) {
        console.error('Could not get collections:', err);
    }
});
getCollection();
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LZOkAj2ezLJCJSAtKHw6ub71n3tVMvL2NQ1O007gaik
