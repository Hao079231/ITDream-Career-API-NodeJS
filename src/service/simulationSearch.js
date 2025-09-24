const client = require('../config/elasticSeachConfig');
const INDEX = 'simulations';

// Tạo index một lần khi khởi động server
async function ensureIndex() {
  const exists = await client.indices.exists({ index: INDEX });
  const isExists = exists.body !== undefined ? exists.body : exists;
  if (!isExists) {
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
    console.log(`Index ${INDEX} created`);
  } else {
    console.log(`Index ${INDEX} already exists`);
  }
}

// 👉 KHÔNG gọi ensureIndex ở đây nữa
async function indexSimulation(simulation) {
  return client.index({
    index: INDEX,
    id: String(simulation.id),
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
    if (error.meta?.statusCode === 404) {
      return { result: 'not_found' };
    }
    throw error;
  }
}

async function searchByTitle(query, size = 20, from = 0) {
  const result = await client.search({
    index: INDEX,
    body: {
      query: { match: { title: { query, fuzziness: 'AUTO' } } },
      from,
      size
    }
  });

  // Luôn fallback để không bị undefined
  const esHits = result.body?.hits?.hits || result.hits?.hits || [];
  const total = result.body?.hits?.total?.value
    ?? result.body?.hits?.total
    ?? result.hits?.total?.value
    ?? result.hits?.total
    ?? 0;

  // ✅ Trả về object chuẩn
  return { hits: esHits, total };
}

module.exports = { searchByTitle };


module.exports = {
  ensureIndex,
  indexSimulation,
  deleteSimulation,
  searchByTitle
};
