const mongoose = require('mongoose');

const pluginsSchema = new mongoose.Schema(
	{
		plugin: {
			type: String,
		},
		version: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model('Plugins', pluginsSchema);
