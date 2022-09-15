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
					const User = await Users.find({
						role: 0,
					}).select('licenses -_id');

					if (User[0].licenses.length < 1) {
						return message.channel.send(
							":x: Didn't find any licenses."
						);
					}

					let page = Math.ceil(User[0].licenses.length / 10);
					if (args[0]) {
						if (!isNaN(args[0]) && args[0] <= page) {
							let pageMulti = Math.round(args[0]);
							let wantedPage = pageMulti * 10 - 10;
							let results = [];
							for (
								let i = wantedPage;
								i < User[0].licenses.length;
								i++
							) {
								let maxResults = 10 + wantedPage;
								let licenseToSearch = User[0].licenses[i];
								let licenseEncrypted = decrypt(
									licenseToSearch.licensekey
								);
								if (i < maxResults) {
									results.push(
										'Licensekey: ' +
											'`' +
											licenseEncrypted +
											'`' +
											'\n' +
											'Client: ' +
											'`' +
											licenseToSearch.clientname +
											'`' +
											' | Plugin: ' +
											'`' +
											licenseToSearch.pluginname +
											'`' +
											'\n'
									);
								} else {
									break;
								}
							}
							const multiPage = new Discord.MessageEmbed()
								.setColor(`${client.config.embed_color}`)
								.setAuthor(
									`Requested by ${message.author.username}`,
									message.author.displayAvatarURL()
								)
								.setTitle(
									`License list (Page ${pageMulti}/${page})`
								)
								.addField(
									'\u200b',
									`${results.toString().replace(/,/g, '\n')}`,
									false
								)

								.addField(
									'\u200b\nWant to get more details?',
									`Use ${client.config.prefix}getlicense command for more specific information about licenses`
								)
								.setFooter(
									`${client.config.name} | By @kassq`,
									client.user.displayAvatarURL()
								);
							await message.channel
								.send(multiPage)
								.then(async (msg) => {
									await msg.react('🆗');
								});
						} else {
							return message.channel.send(
								':x: Invalid page number as argument!'
							);
						}
					} else {
						let results = [];

						for (let i = 0; i < User[0].licenses.length; i++) {
							let maxResults = 10;
							let licenseToSearch = User[0].licenses[i];
							let licenseEncrypted = decrypt(
								licenseToSearch.licensekey
							);
							if (i < maxResults) {
								results.push(
									'Licensekey: ' +
										'`' +
										licenseEncrypted +
										'`' +
										'\n' +
										'Client: ' +
										'`' +
										licenseToSearch.clientname +
										'`' +
										' | Plugin: ' +
										'`' +
										(licenseToSearch.pluginname || 'None') +
										'`' +
										'\n'
								);
							} else {
								break;
							}
						}
						const successEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle(`License list (Page 1/${page})`)
							.addField(
								'\u200b',
								`${results.toString().replace(/,/g, '\n')}`,
								false
							)

							.addField(
								'\u200b\nWant to get more details?',
								`Use ${client.config.prefix}getlicense command for more specific information about licenses`
							)
							.setFooter(
								`${client.config.name} | By @kassq`,
								client.user.displayAvatarURL()
							);
						await message.channel
							.send(successEmbed)
							.then(async (msg) => {
								await msg.react('🆗');
							});
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use licenselist.`
					);
				}
			}
		);
	}
};
