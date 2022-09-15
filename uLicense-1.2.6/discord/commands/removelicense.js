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
			{ DiscordID: message.author.id },
			async function (err, doc) {
				if (err) {
					await console.log(err);
					await message.channel.send(
						':x: Error occurred. Please contact my developer!'
					);
				}
				if (doc === true) {
					if (!args[0]) {
						const exampleEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle('Removelicense command')
							.setDescription(
								'With this command you can remove specific license key!'
							)
							.addField(
								'Command format:',
								'This command takes 1 argument:\n`<license>`'
							)
							.addField(
								'Example use case:',
								'`+removelicense 1234-1234-1234-1234`\nThis example completely removes license 1234-1234-1234-1234 from database. This action cannot be undone!'
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
						let licensekey = args[0];
						let licenseToEdit;
						for (let f = 0; f < User.licenses.length; f++) {
							let licenseToSearch = User.licenses[f].licensekey;
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
									$elemMatch: { licensekey: licenseToEdit },
								},
							});
							if (!licensecheck) {
								return await message.channel.send(
									":x: Couldn't find that license!"
								);
							} else {
								await Users.findOneAndUpdate(
									{ role: 0 },
									{
										$pull: {
											licenses: {
												licensekey: licenseToEdit,
											},
										},
									}
								);
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL()
									)
									.setTitle('License removed')
									.addField('Removed license:', `${args[0]}`)
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
							return message.channel.send(
								":x: Couldn't find that license!"
							);
						}
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use removelicense.`
					);
				}
			}
		);
	}
};
