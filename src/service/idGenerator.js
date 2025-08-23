const SnowflakeId = require('snowflake-id').default;

const snowflake = new SnowflakeId({
  mid: 42, // machine id (0–1023)
  offset: (2020 - 1970) * 31536000 * 1000 // epoch từ 2020
});

function generateId() {
  return snowflake.generate();
}

module.exports = { generateId };
