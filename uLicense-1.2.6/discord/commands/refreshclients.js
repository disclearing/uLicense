const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const axios = require('axios');
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
					try {
						let users = await Users.findOne({
							role: 0,
						});
						let finalnumber = [];
						for (let b = 0; b < users.licenses.length; b++) {
							let clientToCheck = users.licenses[b];
							if (
								clientToCheck.discordID &&
								isNaN(clientToCheck.discordID) === false &&
								clientToCheck.discordID.length === 18
							) {
								await axios
									.get(
										`https://discordapp.com/api/users/${clientToCheck.discordID}`,
										{
											headers: {
												Authorization: `Bot ${client.config.token}`,
											},
										}
									)
									.then(async (res) => {
										await Users.updateMany(
											{
												role: 0,
												'licenses.discordID':
													res.data.id,
												'licenses.clientname': {
													$ne: res.data.username,
												},
											},
											{
												$set: {
													'licenses.$[elem].clientname':
														res.data.username,
												},
											},
											{
												arrayFilters: [
													{
														'elem.discordID':
															res.data.id,
													},
												],
											}
										)
											.then((doc) => {
												finalnumber.push(doc.nModified);
											})
											.catch((err) => {
												console.log(err);
											});
									})
									.catch((err) => {
										console.log(err);
									});
							}
						}
						if (finalnumber.reduce((a, b) => a + b, 0) > 0) {
							let successEmbed = new Discord.MessageEmbed()
								.setColor(`${client.config.embed_color}`)
								.setAuthor(
									`Requested by ${message.author.username}`,
									message.author.displayAvatarURL()
								)
								.setTitle('Successfully updated client names')
								.addField(
									'Update client names:',
									`${finalnumber.reduce((a, b) => a + b, 0)}`
								)
								.setFooter(
									`${client.config.name} | By @kassq`,
									client.user.displayAvatarURL()
								);
							return message.channel
								.send(successEmbed)
								.then(async (msg) => {
									await msg.react('🆗');
								});
						} else {
							let successEmbed = new Discord.MessageEmbed()
								.setColor(`${client.config.embed_color}`)
								.setAuthor(
									`Requested by ${message.author.username}`,
									message.author.displayAvatarURL()
								)
								.setTitle("Didn't find any changes")
								.addField('Update client names:', `0`)
								.setFooter(
									`${client.config.name} | By @kassq`,
									client.user.displayAvatarURL()
								);
							return message.channel
								.send(successEmbed)
								.then(async (msg) => {
									await msg.react('🆗');
								});
						}
					} catch (err) {
						console.log(err);
						return res.status(500).json({ msg: err.message });
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use refreshclients.`
					);
				}
			}
		);
	}
};
