const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema(
	{
		blacklisted: {
			type: String,
		},
		requests: {
			type: Number,
			default: 0,
		},
		region: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model('Blacklist', blacklistSchema);
