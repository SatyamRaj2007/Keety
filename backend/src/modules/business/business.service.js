const Business = require('../../models/Business');
const User = require('../../models/User');
const { ApiError } = require('../../utils/errors');

async function createBusiness(user, input) {
  const business = await Business.create({ ...input, ownerId: user._id });
  await User.updateOne({ _id: user._id }, { $addToSet: { businessIds: business._id } });
  user.businessIds.push(business._id);
  return business;
}

async function updateBusiness(business, input) {
  Object.assign(business, input);
  await business.save();
  return business;
}

async function getBusiness(id, userId) {
  const business = await Business.findOne({ _id: id, ownerId: userId });
  if (!business) {
    throw new ApiError(404, 'BUSINESS_NOT_FOUND', 'Business not found');
  }
  return business;
}

module.exports = { createBusiness, getBusiness, updateBusiness };