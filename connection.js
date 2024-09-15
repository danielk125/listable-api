require('dotenv').config(); 

const { MongoClient } = require('mongodb');

const uri = process.env.ATLAS_URI; 
let client;

async function connectToDatabase() {
    console.log(uri);
    if (!client) {
        client = new MongoClient(uri, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false
        });
        await client.connect();
        console.log('Connected to MongoDB');
    }
    return client;
}

async function getDatabase() {
    console.log(process.env.DATABASE_NAME);
    const client = await connectToDatabase();
    return client.db(process.env.DATABASE_NAME); 
}

module.exports = { getDatabase };