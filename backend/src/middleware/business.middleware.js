const mongoose = require('mongoose');
const Business = require('../models/Business');
const { ApiError } = require('../utils/errors');

async function requireBusiness(req, res, next) {
  const requestedId = req.params.businessId
    || req.businessCandidateId
    || req.get('x-business-id')
    || req.query.businessId
    || req.body.businessId;
  const businessId = requestedId || (req.user.businessIds.length === 1
    ? req.user.businessIds[0].toString()
    : null);

  if (!businessId) {
    return next(new ApiError(400, 'BUSINESS_REQUIRED', 'Select a business using the x-business-id header'));
  }

  if (!mongoose.isValidObjectId(businessId)) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Business ID is invalid'));
  }

  try {
    const business = await Business.findOne({ _id: businessId, ownerId: req.user._id });

    if (!business) {
      return next(new ApiError(404, 'BUSINESS_NOT_FOUND', 'Business not found'));
    }

    req.business = business;
    req.businessId = business._id;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireBusinessFromRouteParam(req, res, next) {
  req.businessCandidateId = req.params.id;
  return requireBusiness(req, res, next);
}

module.exports = { requireBusiness, requireBusinessFromRouteParam };