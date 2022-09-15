const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const moment = require('moment');
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
							.setTitle('Getlicense command')
							.setDescription(
								"With this command you can get specific license's details!"
							)
							.addField(
								'Command format:',
								'This command takes 1 argument:\n`<license>`'
							)
							.addField(
								'Example use case:',
								'`+getlicense 1234-1234-1234-1234`\nThis example gives you details of license 1234-1234-1234-1234.'
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
								let licenseArray = licensecheck.licenses;
								const result = licenseArray.find(
									(element) =>
										element.licensekey.iv ===
											licenseToEdit.iv &&
										element.licensekey.content ===
											licenseToEdit.content
								);

								let timeBetween;
								let timeLeft;
								if (result.expires === 'Never') {
									timeBetween = 'Unlimited';
									timeLeft = 'Unlimited';
								} else {
									let a = moment(result.expires);
									let b = moment(result.timestamp);

									let eventdate = moment(result.expires);
									let todaysdate = moment();
									timeBetween = a.diff(b, 'days') + 1;
									timeLeft = eventdate.diff(
										todaysdate,
										'days'
									);
								}

								let IPlistlength;
								let IPlistlist;
								if (result.IPlist) {
									IPlistlength = result.IPlist.length;
									IPlistlist = result.IPlist.toString().replace(
										/,/g,
										'\n'
									);
								} else {
									IPlistlength = '0';
									IPlistlist = 'none';
								}
								let HWIDlist;
								if (result.HWIDlist) {
									HWIDlist = result.HWIDlist.toString().replace(
										/,/g,
										'\n'
									);
								} else {
									HWIDlist = 'None';
								}

								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL()
									)
									.setTitle('License info')
									.addField('License:', `${args[0]}`, false)
									.addField(
										'Client:',
										`${result.clientname}`,
										true
									)
									.addField(
										'Plugin:',
										`${result.pluginname || 'None'}`,
										true
									)
									.addField(
										'IP-cap',
										`${IPlistlength}/${result.IPcap}`,
										true
									)
									.addField(
										`IP-list`,
										`${IPlistlist || 'None'}`,
										false
									)
									.addField(
										`HWID-list`,
										`${HWIDlist || 'None'}`,
										false
									)
									.addField(
										'Generate date:',
										`${result.timestamp}`,
										true
									)
									.addField(
										'Duration:',
										`${timeBetween} days`,
										true
									)
									.addField(
										'Expires in:',
										`${timeLeft} days`,
										true
									)
									.addField(
										'Description:',
										`${result.description || 'None'}`,
										false
									)
									.addField(
										'DiscordID:',
										`${result.discordID || 'None'}`,
										false
									)
									.addField(
										'Latest IP:',
										`${result.latestip || 'None'}`,
										false
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
							return message.channel.send(
								":x: Couldn't find that license!"
							);
						}
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use getlicense.`
					);
				}
			}
		);
	}
};
