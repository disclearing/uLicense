const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		DiscordID: {
			type: String,
		},
		licenses: {
			type: Array,
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model('Users', userSchema);
