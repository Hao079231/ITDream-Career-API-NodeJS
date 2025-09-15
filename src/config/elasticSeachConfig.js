const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const esClient = new Client({ node: process.env.ES_URL });

module.exports = esClient;