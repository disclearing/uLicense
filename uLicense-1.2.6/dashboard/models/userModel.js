const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter your name!'],
			trim: true,
		},
		discordwebhook: {
			type: String,
		},
		DiscordID: {
			type: String,
		},
		email: {
			type: String,
			required: [true, 'Please enter your email!'],
			trim: true,
			unique: true,
		},
		password: {
			type: String,
			required: [true, 'Please enter your password!'],
		},
		role: {
			type: Number,
			default: 0,
		},
		lastlogin: {
			type: String,
		},
		APIkey: {
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
