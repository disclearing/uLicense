const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const { decrypt } = require('../auth/crypto.js');
exports.run = async (client, message, args) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) {
		return await message.channel.send(
			":x: You don't have enough permissions in this server!"
		);
	} else {
		await Users.exists(
			{ DiscordID: message.author.id, role: 0 },
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
							.setTitle('Cleardata command')
							.setDescription(
								'With this command you can clear HWID / IP data for all licenses or for a specific license!'
							)
							.addField(
								'Command format:',
								'This command takes 2 arguments:\n`<hwid/ip> <license/all>`'
							)
							.addField(
								'Example use case V1:',
								'`+cleardata hwid all`\nThis example clears **ALL** HWID data for **ALL** licenses. This action cannot be undone!'
							)
							.addField(
								'Example use case V2:',
								'`+cleardata hwid 1234-1234-1234-1234`\nThis example clears **ALL** HWID data for **SPECIFIC** license! This action cannot be undone!'
							)
							.addField(
								'Note:',
								'Sub-users **cannot use** this command. This is only for the administrator. If you want to remove just specific IPs / HWIDs of license instead of all, take a look at `+editlicense` command.'
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
						let User = await Users.findOne({
							role: 0,
						});
						if (args[1].toLowerCase() === 'all') {
							if (args[0].toLowerCase() === 'hwid') {
								let licenseToEdit = User.licenses;
								for (let x = 0; x < User.licenses.length; x++) {
									await Users.findOneAndUpdate(
										{
											role: 0,
											'licenses.licensekey':
												licenseToEdit[x].licensekey,
										},
										{
											$set: {
												'licenses.$.HWIDlist': [],
											},
										}
									).catch((err) => {
										console.log(err);
									});
								}
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL()
									)
									.setTitle('Cleared HWID-data')
									.addField(
										'HWID-data cleared for:',
										'All licenses'
									)
									.setFooter(
										`${client.config.name} | By @kassq`,
										client.user.displayAvatarURL()
									);
								return await message.channel
									.send(successEmbed)
									.then(async (msg) => {
										await msg.react('🆗');
									});
							} else if (args[0].toLowerCase() === 'ip') {
								let licenseToEdit = User.licenses;
								for (let x = 0; x < User.licenses.length; x++) {
									await Users.findOneAndUpdate(
										{
											role: 0,
											'licenses.licensekey':
												licenseToEdit[x].licensekey,
										},
										{
											$set: {
												'licenses.$.IPlist': [],
											},
										}
									).catch((err) => {
										console.log(err);
									});
								}
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL()
									)
									.setTitle('Cleared IP-data')
									.addField(
										'IP-data cleared for:',
										'All licenses'
									)
									.setFooter(
										`${client.config.name} | By @kassq`,
										client.user.displayAvatarURL()
									);
								return await message.channel
									.send(successEmbed)
									.then(async (msg) => {
										await msg.react('🆗');
									});
							} else {
								message.channel.send(':x: Invalid arguments!');
							}
						} else {
							let licensekey = args[1];
							let licenseToEdit;
							for (let f = 0; f < User.licenses.length; f++) {
								let licenseToSearch =
									User.licenses[f].licensekey;
								let key = decrypt(licenseToSearch);
								if (key === licensekey) {
									licenseToEdit = licenseToSearch;
									break;
								}
							}
							if (licenseToEdit) {
								const licensecheck = await Users.findOne({
									role: 0,
									licenses: {
										$elemMatch: {
											licensekey: licenseToEdit,
										},
									},
								});
								if (!licensecheck) {
									return await message.channel.send(
										":x: Couldn't find that license!"
									);
								} else {
									if (args[0].toLowerCase() === 'hwid') {
										await Users.findOneAndUpdate(
											{
												role: 0,
												'licenses.licensekey': licenseToEdit,
											},
											{
												$set: {
													'licenses.$.HWIDlist': [],
												},
											}
										).catch((err) => {
											console.log(err);
										});
										const successEmbed = new Discord.MessageEmbed()
											.setColor(
												`${client.config.embed_color}`
											)
											.setAuthor(
												`Requested by ${message.author.username}`,
												message.author.displayAvatarURL()
											)
											.setTitle('Cleared HWID-data')
											.addField(
												'HWID-data removed for:',
												`${args[1]}`
											)
											.setFooter(
												`${client.config.name} | By @kassq`,
												client.user.displayAvatarURL()
											);
										return await message.channel
											.send(successEmbed)
											.then(async (msg) => {
												await msg.react('🆗');
											});
									} else if (args[0].toLowerCase() === 'ip') {
										await Users.findOneAndUpdate(
											{
												role: 0,
												'licenses.licensekey': licenseToEdit,
											},
											{
												$set: {
													'licenses.$.IPlist': [],
												},
											}
										).catch((err) => {
											console.log(err);
										});
										const successEmbed = new Discord.MessageEmbed()
											.setColor(
												`${client.config.embed_color}`
											)
											.setAuthor(
												`Requested by ${message.author.username}`,
												message.author.displayAvatarURL()
											)
											.setTitle('Cleared IP-data')
											.addField(
												'IP-data removed for:',
												`${args[1]}`
											)
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
								}
							} else {
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						}
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use cleardata.`
					);
				}
			}
		);
	}
};
