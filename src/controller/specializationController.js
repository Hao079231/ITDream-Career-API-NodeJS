const specialization = require("../model/specialization")
const account = require('../model/account');
const { ACCOUNT_KINDS } = require('../constants/constant');
require('dotenv').config();

exports.createSpecialization = async (req, res) => {
  try {
    const decode = req.user;

    const requestUser = await account.findOne({ where: { id: decode.id } });

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    if (!decode.pCodes.includes('SP_C')) {
      return res.status(403).json({ message: 'Specialization cannot be created' });
    }

    const { name } = req.body;
    const specializationExists = await specialization.findOne({ where: { name } });
    if (specializationExists) {
      return res.status(400).json({ message: 'Specialization already exists' });
    }
    await specialization.create({ name });
    res.status(200).json({ message: 'Specialization created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create specialization' });
  }
};

exports.getListSpecializations = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('SP_L')) {
      return res.status(403).json({ message: 'Specialization cannot be listed' });
    }

    const specializations = await specialization.findAll();
    const specializationList = specializations.map(specialization => {
      const specializationData = specialization.toJSON();
      delete specializationData.createdAt;
      delete specializationData.updatedAt;
      return specializationData;
    });

    res.status(200).json({ message: 'Get list specialization successfully', data: specializationList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve specializations' });
  }
};

exports.updateSpecialization = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('SP_U')) {
      return res.status(403).json({ message: 'Specialization cannot be updated' });
    }
    const { id, name } = req.body;
    const specializationToUpdate = await specialization.findByPk(id);
    if (!specializationToUpdate) {
      return res.status(404).json({ message: 'Specialization not found' });
    }
    specializationToUpdate.name = name || specializationToUpdate.name;
    await specializationToUpdate.save();
    res.status(200).json({ message: 'Specialization updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update specialization' });
  }
};

exports.deleteSpecialization = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('SP_D')) {
      return res.status(403).json({ message: 'Specialization cannot be deleted' });
    }
    const { id } = req.params;
    const specializationToDelete = await specialization.findByPk(id);
    if (!specializationToDelete) {
      return res.status(404).json({ message: 'Specialization not found' });
    }
    await specializationToDelete.destroy();
    res.status(200).json({ message: 'Specialization deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete specialization' });
  }
};
