const { PineconeClient } = require("@pinecone-database/pinecone");
const uuid = require('uuid').v4; 
let setting = require("../key.json");

const pinecone = new PineconeClient();

pinecone.init({
  environment: setting.pineconeEnvironment,
  apiKey: setting.pineconeApi,
});

//upsert function
const upsert = async (data) => {
    const index = pinecone.Index('isla');
    const { namespace, timeStamp, embedding, content } = data;

    const upsertRequest = {
        vectors: [
            {
                id: uuid(),
                values: embedding,
                metadata: {
                    timeStamp,
                    content
                }
            }
        ],
        namespace: namespace
    }
    try {
        const upsertResponse = await index.upsert({ upsertRequest });
        return upsertResponse;
    }catch(err) {
        return err
    }
};

const query = async (embed, namespace) => {
    const index = pinecone.Index('isla');
    const queryRequest = {
        vector: embed,
        topK: 1,
        includeValues: true,
        includeMetadata: true,
        namespace: namespace
    }
    try {
        const response = await index.query({ queryRequest })
        return { data: response }
    }catch(err) {
        return { error: err }
    }
};

const deleteAll = async (namespace) => {
    const index = pinecone.Index('isla');
    try {
        await index.delete1({deleteAll:true, namespace: namespace})
    } catch (error) {
        console.log(error)
    }
};

module.exports = {
    upsert,
    query,
    deleteAll
}