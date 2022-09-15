const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const Plugins = require('../models/pluginDB.js');
exports.run = async (client, message, args) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) {
		return await message.channel.send(
			":x: You don't have enough permissions in this server!"
		);
	} else {
		await Users.exists(
			{ DiscordID: message.author.id },
			async function (err, doc) {
				if (err) {
					await console.log(err);
					await message.channel.send(
						':x: Error occurred. Please contact my developer!'
					);
				}
				if (doc === true) {
					if (!args[0] || !args[1]) {
						const exampleEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle('Setversion command')
							.setDescription(
								'With this command you can set your latest application version number. You can use this number to check if your client is using outdated version!'
							)
							.addField(
								'Command format:',
								'This command takes 2 arguments:\n`<plugin> <version number>`'
							)
							.addField(
								'Example use case:',
								'`+setversion myplugin 2.0`\nThis example sets version number of myplugin to 2.0!'
							)
							.setFooter(
								`${client.config.name} | By @kassq`,
								client.user.displayAvatarURL()
							);
						return await message.channel
							.send(exampleEmbed)
							.then(async (msg) => {
								await msg.react('🆗');
							});
					} else {
						const licenseexists = await Users.findOne({
							role: 0,
							'licenses.pluginname': args[0],
						});
						if (!licenseexists) {
							return message.channel.send(
								':x: You havent created any license for given plugin. Keep in mind that this is case sensitive.'
							);
						}

						const pluginexists = await Plugins.findOne({
							plugin: args[0],
						});
						if (!pluginexists) {
							const newPlugin = new Plugins({
								plugin: args[0],
								version: args[1],
							});
							await newPlugin.save();
						} else {
							await Plugins.findOneAndUpdate(
								{
									plugin: args[0],
								},
								{ $set: { version: args[1] } }
							);
						}
						const successEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle('Updated version')
							.addField('Plugin:', `${args[0]}`)
							.addField('New version', args[1])
							.setFooter(
								`${client.config.name} | By @kassq`,
								client.user.displayAvatarURL()
							);
						return await message.channel
							.send(successEmbed)
							.then(async (msg) => {
								await msg.react('🆗');
							});
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use setversion.`
					);
				}
			}
		);
	}
};
