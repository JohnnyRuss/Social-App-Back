const mongoose = require('mongoose');

const RefresherSchema = new mongoose.Schema({
  refresher: String,
});

const Refresher = mongoose.model('Refresher', RefresherSchema);

module.exports = Refresher;
