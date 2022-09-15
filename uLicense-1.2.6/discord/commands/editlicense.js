const Discord = require('discord.js');
const Users = require('../models/userDB.js');
const { decrypt } = require('../auth/crypto.js');
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
					if (!args[0] || !args[1] || !args[2]) {
						const exampleEmbed = new Discord.MessageEmbed()
							.setColor(`${client.config.embed_color}`)
							.setAuthor(
								`Requested by ${message.author.username}`,
								message.author.displayAvatarURL()
							)
							.setTitle('Editlicense command')
							.setDescription(
								'With this command you can edit existing licenses!'
							)
							.addField(
								'Command format:',
								'This command takes 3 arguments:\n`<license> <ipcap/plugin/client/desc/removeip/removehwid/hwidcap> <value>`'
							)
							.addField(
								'Example use case:',
								"`+editlicense 1234-1234-1234-1234 ipcap 10`\nThis example edits 1234-1234-1234-1234 license's IP-cap value to 10"
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
						if (args[1] === 'ipcap') {
							if (isNaN(args[2])) {
								return message.channel.send(
									':x: New value for IP cap can only be a number!'
								);
							}
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
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
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$set: {
											'licenses.$.IPcap': args[2],
										},
									}
								);
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited license')
									.addField('Edited license:', `${args[0]}`)
									.addField(
										`New value for ${args[1]}:`,
										`${args[2]}`
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'plugin') {
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
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
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$set: {
											'licenses.$.pluginname': args[2],
										},
									}
								);
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL()
									)
									.setTitle('Successfully edited license')
									.addField('Edited license:', `${args[0]}`)
									.addField(
										`New value for ${args[1]}:`,
										`${args[2]}`
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'client') {
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
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
							let clientname = args[2];
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

							if (licenseToEdit) {
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$set: {
											'licenses.$.clientname': clientnameFinal,
											'licenses.$.discordID': discordID,
										},
									}
								);
								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited license')
									.addField('Edited license:', `${args[0]}`)
									.addField(
										`New value for client:`,
										`${clientnameFinal}`
									)
									.addField('DiscordID', `${discordID}`)
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'removeip') {
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
							let licenseToEdit;
							let IPlist;
							for (let f = 0; f < User.licenses.length; f++) {
								let licenseToSearch =
									User.licenses[f].licensekey;
								let key = decrypt(licenseToSearch);
								if (key === licensekey) {
									licenseToEdit = licenseToSearch;
									IPlist = User.licenses[f].IPlist;
									break;
								}
							}
							if (
								IPlist === undefined ||
								!IPlist.includes(args[2])
							) {
								return message.channel.send(
									":x: Couldn't find that IP for that license."
								);
							}
							if (licenseToEdit) {
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$pull: {
											'licenses.$.IPlist': args[2],
										},
									}
								);
								let ipListFinal;
								if (IPlist && IPlist.length > 1) {
									ipListFinal = IPlist.filter(
										(item) => item !== args[2]
									)
										.toString()
										.replace(/,/g, '\n');
								} else {
									ipListFinal = 'empty';
								}

								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited license')
									.addField('Edited license:', `${args[0]}`)
									.addField(`Removed IP:`, `${args[2]}`)
									.addField(`IP-list now:`, ipListFinal)
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'hwidcap') {
							if (
								isNaN(args[2]) === true &&
								args[2].toLowerCase() !== 'none'
							) {
								return message.channel.send(
									':x: Invalid value for HWID-cap! Value must be a number or none!'
								);
							}

							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
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
							let hwidcapFinal;
							if (args[2].toLowerCase() === 'none') {
								hwidcapFinal = 'None';
							} else {
								hwidcapFinal = args[2];
							}
							if (licenseToEdit) {
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$set: {
											'licenses.$.HWIDcap': hwidcapFinal,
										},
									}
								);

								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited HWID-cap')
									.addField('Edited license:', `${args[0]}`)
									.addField(
										`New HWID-Cap:`,
										`${hwidcapFinal}`
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'desc') {
							if (args[2].length < 4) {
								return message.channel.send(
									':x: Description value must be `None` or over 4 characters long!'
								);
							}
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
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
							let newdesc;
							if (args[2].toLowerCase() === 'none') {
								newdesc = '';
							} else {
								let descpre = [...args];
								descpre.shift();
								descpre.shift();
								newdesc = descpre.join(' ');
							}
							if (licenseToEdit) {
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$set: {
											'licenses.$.description': newdesc,
										},
									}
								);

								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited description')
									.addField('Edited license:', `${args[0]}`)
									.addField(
										`New description value:`,
										`${newdesc || 'None'}`
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else if (args[1] === 'removehwid') {
							let User = await Users.findOne({
								role: 0,
							});
							let licensekey = args[0];
							let licenseToEdit;
							let HWIDlist;
							for (let f = 0; f < User.licenses.length; f++) {
								let licenseToSearch =
									User.licenses[f].licensekey;
								let key = decrypt(licenseToSearch);
								if (key === licensekey) {
									licenseToEdit = licenseToSearch;
									HWIDlist = User.licenses[f].HWIDlist;
									break;
								}
							}
							if (
								HWIDlist === undefined ||
								!HWIDlist.includes(args[2])
							) {
								return message.channel.send(
									":x: Couldn't find that HWID for that license."
								);
							}
							if (licenseToEdit) {
								await Users.findOneAndUpdate(
									{
										role: 0,
										'licenses.licensekey': licenseToEdit,
									},
									{
										$pull: {
											'licenses.$.HWIDlist': args[2],
										},
									}
								);
								let hwidListFinal;
								if (HWIDlist && HWIDlist.length > 1) {
									hwidListFinal = HWIDlist.filter(
										(item) => item !== args[2]
									)
										.toString()
										.replace(/,/g, '\n');
								} else {
									hwidListFinal = 'empty';
								}

								const successEmbed = new Discord.MessageEmbed()
									.setColor(`${client.config.embed_color}`)
									.setAuthor(
										`Requested by ${message.author.username}`,
										message.author.displayAvatarURL(),
										client.config.siteURL
									)
									.setTitle('Successfully edited license')
									.addField('Edited license:', `${args[0]}`)
									.addField(`Removed HWID:`, `${args[2]}`)
									.addField(`HWID-list now:`, hwidListFinal)
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
								return message.channel.send(
									":x: Couldn't find that license!"
								);
							}
						} else {
							return await message.channel.send(
								`:x: ${args[1]} is not a valid argument.`
							);
						}
					}
				} else {
					return await console.log(
						`${message.author.username} tried to use editlicense.`
					);
				}
			}
		);
	}
};
