const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const Licensehistory = require('../models/licensehistoryModel.js');
const moment = require('moment');
const crypto = require('crypto');
const axios = require('axios');
const { encrypt } = require('../auth/crypto.js');
const now = new Date();
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
					if (!args[0] || !args[1] || !args[2] || !args[3]) {
						const exampleEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle('Addlicense command')
							.setDescription(
								'With this command you can add licenses without opening our web dashboard!'
							)
							.addField(
								'Command format:',
								"This command takes 4 arguments:\n`<client's name> <ip cap> <expires> <plugin name>`"
							)
							.addField(
								'Example use case:',
								'`+addlicense ExampleUser 5 60d MyPlugin`\nThis example creates license for ExampleUser, IPs are capped at 5, license expires in 60days and it only works for MyPlugin!'
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
						if (isNaN(args[1]) === true) {
							return await message.channel.send(
								':x: IP-cap must be a number!'
							);
						} else if (
							isNaN(args[2].slice(0, -1)) === true &&
							args[2].toLowerCase() !== 'never'
						) {
							return await message.channel.send(
								':x: Expire date must be format: 60d/never'
							);
						} else if (
							isNaN(args[0]) === false &&
							args[0].length !== 18
						) {
							return await message.channel.send(
								':x: Client name cannot be a number unless it is valid DiscordID'
							);
						} else {
							let licensekeyFirst =
								`${crypto
									.randomBytes(3)
									.toString('hex')
									.slice(0, -1)}-` +
								`${crypto
									.randomBytes(3)
									.toString('hex')
									.slice(0, -1)}-` +
								`${crypto
									.randomBytes(3)
									.toString('hex')
									.slice(0, -1)}-` +
								`${crypto
									.randomBytes(3)
									.toString('hex')
									.slice(0, -1)}`;
							let licensekeyNotEncrypted = licensekeyFirst.toUpperCase();
							let licensekey = encrypt(licensekeyNotEncrypted);
							let IPcap = args[1];
							let expiresStart = moment(new Date())
								.add(args[2].slice(0, -1), 'days')
								.toDate()
								.toISOString();

							let expires = isNaN(args[2].slice(0, -1))
								? 'Never'
								: expiresStart.toString();
							let pluginname = args[3];
							let description = 'None';
							let clientname = args[0];
							let timestamp = new Date();
							let latestrequest = 'None';

							let clientnameFinal;
							let discordID;
							if (
								isNaN(clientname) === false &&
								clientname.length === 18
							) {
								await axios
									.get(
										`https://discordapp.com/api/users/${clientname}`,
										{
											headers: {
												Authorization: `Bot ${client.config.token}`,
											},
										}
									)
									.then((res) => {
										clientnameFinal = res.data.username;
										discordID = res.data.id;
									})
									.catch((err) => {
										if (
											err.response.statusText.toLowerCase() ===
											'not found'
										) {
											clientnameFinal = 'NOT_FOUND';
											return console.log(
												`\u001b[36m=> [${new Date().toLocaleTimeString()}] Invalid DiscordID while creating license!`
											);
										}
									});
							}
							if (clientnameFinal === 'NOT_FOUND') {
								return message.channel.send(
									":x: Couldn't find that DiscordID!"
								);
							} else if (clientnameFinal === undefined) {
								clientnameFinal = clientname;
							}
							if (discordID == undefined) {
								discordID = 'None';
							}

							const licenses = {
								licensekey,
								IPcap,
								expires,
								pluginname,
								description,
								clientname: clientnameFinal,
								HWIDcap: 'None',
								timestamp,
								latestrequest,
								discordID,
							};
							await Users.findOneAndUpdate(
								{ role: 0 },
								{
									$push: {
										licenses,
									},
								}
							);
							let months = [
								'January',
								'February',
								'March',
								'April',
								'May',
								'June',
								'July',
								'August',
								'September',
								'October',
								'November',
								'December',
							];
							let monthNumber = months[now.getMonth()];
							const yearExists = await Licensehistory.findOne({
								year: now.getFullYear(),
							});
							if (!yearExists) {
								const year = now.getFullYear();
								const newYear = new Licensehistory({
									year,
									January: 0,
									February: 0,
									March: 0,
									April: 0,
									May: 0,
									June: 0,
									July: 0,
									August: 0,
									September: 0,
									October: 0,
									November: 0,
									December: 0,
								});
								await newYear.save();
								await Licensehistory.findOneAndUpdate(
									{ year: now.getFullYear() },
									{ $inc: { [monthNumber.toLowerCase]: 1 } }
								);
							} else {
								await Licensehistory.findOneAndUpdate(
									{ year: now.getFullYear() },
									{ $inc: { [monthNumber.toLowerCase()]: 1 } }
								);
							}

							const successEmbed = new Discord.MessageEmbed()
								.setColor(`${client.config.embed_color}`)
								.setAuthor(
									`Requested by ${message.author.username}`,
									message.author.displayAvatarURL()
								)
								.setTitle('Successfully added license')
								.addField('Client:', `${clientnameFinal}`)
								.addField('DiscordID', `${discordID}`)
								.addField(
									'License:',
									`${licensekeyNotEncrypted}`
								)
								.addField('IP-cap:', `${IPcap}`)
								.addField('Expiry date', `${expires}`)
								.addField('Plugin:', `${pluginname}`)
								.addField('Created:', `${timestamp}`)
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
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use addlicense.`
					);
				}
			}
		);
	}
};
