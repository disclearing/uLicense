const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
	date: {
		type: String,
	},
	requests: {
		type: Number,
		default: 0,
	},
	rejected: {
		type: Number,
		default: 0,
	},
});
module.exports = mongoose.model('Dailyrequests', requestSchema);
