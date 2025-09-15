const { SIMULATION_LEVEL } = require('../constants/constant');

const validateSimulationLevel = (level) => {
  const validLevels = Object.values(SIMULATION_LEVEL);
  if (!validLevels.includes(level)) {
    return {
      isValid: false,
      message: 'Invalid simulation level',
      validLevels: validLevels
    };
  }
  return {
    isValid: true
  };
};

module.exports = {
  validateSimulationLevel
};