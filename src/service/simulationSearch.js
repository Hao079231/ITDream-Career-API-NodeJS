const client = require('../config/elasticSeachConfig');
const INDEX = 'simulations';

async function ensureIndex() {
  const exists = await client.indices.exists({ index: INDEX });
  if (!exists.body) {
    await client.indices.create({
      index: INDEX,
      body: {
        mappings: {
          properties: {
            id: { type: 'long' },
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text' },
            educatorId: { type: 'long' },
            specializationId: { type: 'long' },
            level: { type: 'integer' }
          }
        }
      }
    });
  }
}

async function indexSimulation(simulation) {
  await ensureIndex();
  return client.index({
    index: INDEX,
    id: simulation.id,
    body: {
      id: simulation.id,
      title: simulation.title,
      description: simulation.description,
      educatorId: simulation.educatorId,
      specializationId: simulation.specializationId,
      level: simulation.level
    },
    refresh: true
  });
}

async function deleteSimulation(id) {
  try {
    return client.delete({
      index: INDEX,
      id: String(id),
      refresh: true
    });
  } catch (error) {
    if (error.meta.statusCode === 404) {
      return { result: 'not_found' };
    };
  }
}

async function searchSimulations(query, size = 20, from = 0) {
  await ensureIndex();
  const { body } = await client.search({
    index: INDEX,
    body: {
      query: {
        match: { title: { query: query, fuzziness: "AUTO" } }
      },
      from,
      size
    }
  });
  return body.hits.hits.map(hit => hit._source);
}

module.exports = {
  indexSimulation,
  deleteSimulation,
  searchSimulations
};