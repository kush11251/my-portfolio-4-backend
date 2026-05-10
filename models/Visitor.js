const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  isMobile: { type: Boolean, default: false },
  isTablet: { type: Boolean, default: false },
  isDesktop: { type: Boolean, default: true },
  browser: { type: String },
  browser_version: { type: String },
  device: { type: String },
  deviceType: { type: String },
  orientation: { type: String },
  os: { type: String },
  os_version: { type: String },
  userAgent: { type: String },
  src: { type: String },
  userName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);