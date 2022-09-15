const router = require('express').Router();
const Users = require('../models/userModel');
const Blacklist = require('../models/blacklistModel');
const Dailyrequests = require('../models/requestModel');
const Plugins = require('../models/pluginModel.js');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const moment = require('moment');
const rateLimit = require('express-rate-limit');
const { decrypt } = require('../middleware/crypto');

const apiLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
});
router.post('/v1', apiLimit, async (req, res) => {
	try {
		let now = new Date();
		const dateExists = await Dailyrequests.findOne({
			date: now.toLocaleDateString(),
		});
		const AddOneToRejected = async () => {
			try {
				let now = new Date();
				if (!dateExists) {
					let date = now.toLocaleDateString();
					let requests = 0;
					let rejected = 1;
					const newDate = new Dailyrequests({
						date,
						requests,
						rejected,
					});

					await newDate.save();
				} else {
					await Dailyrequests.findOneAndUpdate(
						{ date: now.toLocaleDateString() },
						{ $inc: { rejected: 1 } }
					);
				}
			} catch (error) {
				return console.log(error);
			}
		};

		if (!req.headers.authorization) {
			return res.json({
				msg: 'FAILED_AUTHENTICATION',
				status: 'failed',
			});
		} else {
			if (
				!req.body.hwid ||
				!req.body.license ||
				!req.body.plugin ||
				!req.body.version
			) {
				return res.json({
					msg: 'FAILED_AUTHENTICATION',
					status: 'failed',
				});
			}
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
			if (ip.substr(0, 7) == '::ffff:') {
				ip = ip.substr(7);
			}
			const ApiCheck = await Users.findOne({
				APIkey: req.headers.authorization,
			});
			if (
				!ApiCheck ||
				req.headers.authorization.toLowerCase() === 'none'
			) {
				return res.json({
					msg: 'FAILED_AUTHENTICATION',
					status: 'failed',
				});
			}
			let blacklistedArray = [req.body.hwid, ip];
			const BlacklistCheck = await Blacklist.findOne({
				blacklisted: blacklistedArray,
			});
			if (BlacklistCheck) {
				await Blacklist.findOneAndUpdate(
					{ blacklisted: blacklistedArray },
					{ $inc: { requests: 1 } }
				);
				if (ApiCheck.discordwebhook) {
					const userWebhookURL = new Webhook(
						`${ApiCheck.discordwebhook}`
					);
					const blacklistEmbed = new MessageBuilder()
						.setTitle(`Blacklisted IP/HWID`)
						.setTimestamp()
						.setColor('#ff0000')
						.addField('License', `${req.body.license}`)
						.addField('IP-Address', `${ip}`)
						.addField('HWID', `${req.body.hwid}`)
						.addField('Version', `${req.body.version}`)
						.setFooter(
							`uLicense | Made by @kassq`,
							'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
						);
					userWebhookURL.send(blacklistEmbed);
					return res.json({
						msg: 'BLACKLISTED_AUTH',
						status: 'failed',
					});
				} else {
					return res.json({
						msg: 'BLACKLISTED_AUTH',
						status: 'failed',
					});
				}
			}
			let Licensebody;
			let Clientname;
			for (let f = 0; f < ApiCheck.licenses.length; f++) {
				let licenseToSearch = ApiCheck.licenses[f].licensekey;
				let key = decrypt(licenseToSearch);
				if (key === req.body.license) {
					Licensebody = licenseToSearch;
					Clientname = ApiCheck.licenses[f].clientname;
					break;
				}
			}
			if (!Licensebody || Licensebody === undefined) {
				if (ApiCheck) {
					if (ApiCheck.discordwebhook) {
						const userWebhookURL = new Webhook(
							`${ApiCheck.discordwebhook}`
						);
						const successembed = new MessageBuilder()
							.setTitle(`Failed authentication`)
							.setTimestamp()
							.setColor('#F8C300')
							.addField('License', `${req.body.license}`)
							.addField('IP-Address', `${ip}`)
							.addField('HWID', `${req.body.hwid}`)
							.addField('Version', `${req.body.version}`)
							.setFooter(
								`uLicense | Made by @kassq`,
								'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
							);
						userWebhookURL.send(successembed);

						await console.log(
							`\u001b[36m=> [${new Date().toLocaleTimeString()}] Someone tried to start server, but failed authentication!\n=> [DETAILS ] IP: ${ip} | HWID: ${
								req.body.hwid
							} | License: ${req.body.license}`
						);
						AddOneToRejected();

						return res.json({
							msg: 'FAILED_AUTHENTICATION',
							status: 'failed',
						});
					} else {
						AddOneToRejected();

						return res.json({
							msg: 'FAILED_AUTHENTICATION',
							status: 'failed',
						});
					}
				} else {
					return res.json({ msg: 'Error occurred!' });
				}
			} else if (Licensebody) {
				const IPcap = await Users.findOne({
					APIkey: req.headers.authorization,
					'licenses.licensekey': Licensebody,
				});
				let licenseArray = IPcap.licenses;
				const result = licenseArray.find(
					(element) =>
						element.licensekey.iv === Licensebody.iv &&
						element.licensekey.content === Licensebody.content
				);
				if (result.expires !== 'Never') {
					const today = moment();
					if (moment(result.expires).isBefore(today) === true) {
						if (IPcap.discordwebhook) {
							const userWebhookURL = new Webhook(
								`${IPcap.discordwebhook}`
							);
							const successembed = new MessageBuilder()
								.setTitle(`Expired license key`)
								.setTimestamp()
								.setColor('#BC0057')
								.addField('License', `${req.body.license}`)
								.addField('Client:', `${Clientname}`)
								.addField(
									'DiscordID:',
									`${result.discordID || 'None'}`
								)
								.addField('Plugin', `${req.body.plugin}`)
								.addField('IP-Address', `${ip}`)
								.addField('HWID', `${req.body.hwid}`)
								.addField('Version', `${req.body.version}`)
								.addField(
									'Expired',
									`${today.diff(
										result.expires,
										'days'
									)} days ago`
								)
								.setFooter(
									`uLicense | Made by @kassq`,
									'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
								);
							AddOneToRejected();
							await console.log(
								`\u001b[36m=> [${new Date().toLocaleTimeString()}] User tried to start, but his licensekey was expired!\n=> [DETAILS ] IP: ${ip} | HWID: ${
									req.body.hwid
								} | License: ${req.body.license}`
							);
							res.json({
								msg: 'EXPIRED_LICENSE',
								status: 'failed',
							});
							return userWebhookURL.send(successembed);
						} else {
							AddOneToRejected();

							return res.json({
								msg: 'EXPIRED_LICENSE',
								status: 'failed',
							});
						}
					}
				}
				if (
					result.HWIDlist &&
					result.HWIDcap &&
					result.HWIDcap.toLowerCase() !== 'none'
				) {
					if (
						!result.HWIDlist.includes(req.body.hwid) &&
						result.HWIDcap <= result.HWIDlist.length
					) {
						if (IPcap.discordwebhook) {
							const userWebhookURL = new Webhook(
								`${IPcap.discordwebhook}`
							);
							const successembed = new MessageBuilder()
								.setTitle(`Maximum HWIDs reached`)
								.setTimestamp()
								.setColor('#A652BB')
								.addField('License', `${req.body.license}`)
								.addField('Client:', `${Clientname}`)
								.addField(
									'DiscordID:',
									`${result.discordID || 'None'}`
								)
								.addField('Plugin', `${req.body.plugin}`)
								.addField('IP-Address', `${ip}`)
								.addField('HWID', `${req.body.hwid}`)
								.addField('Version', `${req.body.version}`)
								.addField(
									'HWID-Cap',
									`${result.HWIDlist.length}/${result.HWIDcap}`
								)
								.setFooter(
									`uLicense | Made by @kassq`,
									'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
								);

							AddOneToRejected();
							await console.log(
								`\u001b[36m=> [${new Date().toLocaleTimeString()}] User tried to start server, but he has reached maximum HWIDs!\n=> [DETAILS ] IP: ${ip} | HWID: ${
									req.body.hwid
								} | License: ${req.body.license}`
							);
							res.json({
								msg: 'MAXIMUM_HWIDS',
								status: 'failed',
							});
							return userWebhookURL.send(successembed);
						} else {
							AddOneToRejected();

							return res.json({
								msg: 'MAXIMUM_HWIDS',
								status: 'failed',
							});
						}
					}
				}
				if (result.IPlist) {
					if (
						!result.IPlist.includes(ip) &&
						result.IPcap <= result.IPlist.length
					) {
						if (IPcap.discordwebhook) {
							const userWebhookURL = new Webhook(
								`${IPcap.discordwebhook}`
							);
							const successembed = new MessageBuilder()
								.setTitle(`Maximum IPs reached`)
								.setTimestamp()
								.setColor('#A652BB')
								.addField('License', `${req.body.license}`)
								.addField('Client:', `${Clientname}`)
								.addField(
									'DiscordID:',
									`${result.discordID || 'None'}`
								)
								.addField('Plugin', `${req.body.plugin}`)
								.addField('IP-Address', `${ip}`)
								.addField('HWID', `${req.body.hwid}`)
								.addField('Version', `${req.body.version}`)
								.addField(
									'IP-Cap',
									`${result.IPlist.length}/${result.IPcap}`
								)
								.setFooter(
									`uLicense | Made by @kassq`,
									'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
								);

							AddOneToRejected();
							await console.log(
								`\u001b[36m=> [${new Date().toLocaleTimeString()}] User tried to start server, but he has reached maximum IPs!\n=> [DETAILS ] IP: ${ip} | HWID: ${
									req.body.hwid
								} | License: ${req.body.license}`
							);
							res.json({
								msg: 'MAXIMUM_IPS',
								status: 'failed',
							});
							return userWebhookURL.send(successembed);
						} else {
							AddOneToRejected();

							return res.json({
								msg: 'MAXIMUM_IPS',
								status: 'failed',
							});
						}
					}
				}
				if (
					req.body.plugin.toLowerCase() !==
						result.pluginname.toLowerCase() &&
					result.pluginname !== ''
				) {
					if (IPcap.discordwebhook) {
						const userWebhookURL = new Webhook(
							`${IPcap.discordwebhook}`
						);
						const successembed = new MessageBuilder()
							.setTitle(`Wrong plugin name`)
							.setTimestamp()
							.setColor('#CC7900')
							.addField('License', `${req.body.license}`)
							.addField('Client:', `${Clientname}`)
							.addField(
								'DiscordID:',
								`${result.discordID || 'None'}`
							)
							.addField('IP-Address', `${ip}`)
							.addField('HWID', `${req.body.hwid}`)
							.addField('Version', `${req.body.version}`)
							.addField(
								'Plugin',
								`${req.body.plugin}/${result.pluginname}`
							)
							.setFooter(
								`uLicense | Made by @kassq`,
								'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
							);
						AddOneToRejected();
						await console.log(
							`\u001b[36m=> [${new Date().toLocaleTimeString()}] User tried to start server, but plugin name was invalid!\n=> [DETAILS ] IP: ${ip} | HWID: ${
								req.body.hwid
							} | License: ${req.body.license}`
						);
						res.json({
							msg: 'INVALID_PLUGIN',
							status: 'failed',
						});
						return userWebhookURL.send(successembed);
					} else {
						AddOneToRejected();

						return res.json({
							msg: 'INVALID_PLUGIN',
							status: 'failed',
						});
					}
				}

				await Users.updateOne(
					{
						APIkey: req.headers.authorization,
						'licenses.licensekey': Licensebody,
					},
					{
						$set: {
							'licenses.$.latestip': ip,
							'licenses.$.latestrequest': new Date(),
						},
						$addToSet: {
							'licenses.$.IPlist': ip,
							'licenses.$.HWIDlist': req.body.hwid,
						},
					}
				);
				if (!dateExists) {
					let now = new Date();
					let date = now.toLocaleDateString();
					let requests = 1;
					let rejected = 0;
					const newDate = new Dailyrequests({
						date,
						requests,
						rejected,
					});

					await newDate.save();
				} else {
					let now = new Date();
					await Dailyrequests.findOneAndUpdate(
						{ date: now.toLocaleDateString() },
						{ $inc: { requests: 1 } }
					);
				}

				let niggahash = req.headers.authorization.substring(0, 2); // API keyn 2 ekaa merkkiä
				let thash = Date.now().toString().slice(0, -5); // Timestamppi unix muodossa (universaali aikamuoto)
				let lhashL = req.body.license.substring(0, 2); // Lisenssin 2 ensimmäistä merkkiä
				let lhashR = req.body.license.substring(
					// Lisenssin 2 viimeistä merkkiä
					req.body.license.length - 2,
					req.body.license.length
				);
				let rhash = Buffer.from(lhashL + lhashR + niggahash).toString(
					'base64'
				); // BASE64 encoded [Lisenssin 2 ekaa + 2 vikaa kirjainta]
				const finalhash = `${rhash}694201337${thash}`; // ns "valmis" muoto

				const version = await Plugins.findOne({
					plugin: req.body.plugin,
				});
				let versionfinal;
				if (version) {
					versionfinal = version.version;
				} else {
					versionfinal = 'unknown';
				}

				res.json({
					msg: 'SUCCESSFUL_AUTHENTICATION',
					status: 'success',
					version: versionfinal,
					neekeri: finalhash,
				});

				if (ApiCheck.discordwebhook) {
					const userWebhookURL = new Webhook(
						`${ApiCheck.discordwebhook}`
					);
					const successembed = new MessageBuilder()
						.setTitle(`Successful authentication`)
						.setTimestamp()
						.setColor('#0099E1')
						.addField('License', `${req.body.license}`)
						.addField('Client:', `${Clientname}`)
						.addField('DiscordID:', `${result.discordID || 'None'}`)
						.addField('Plugin', `${req.body.plugin}`)
						.addField('IP-Address', `${ip}`)
						.addField('HWID', `${req.body.hwid}`)
						.addField('Version', `${req.body.version}`)
						.setFooter(
							`uLicense | Made by @kassq`,
							'https://cdn.discordapp.com/attachments/729088611986702508/795962314015899668/lisenssi.png'
						);
					await console.log(
						`\u001b[36m=> [${new Date().toLocaleTimeString()}] User had successful authentication!\n=> [DETAILS ] IP: ${ip} | HWID: ${
							req.body.hwid
						} | License: ${req.body.license}`
					);
					userWebhookURL.send(successembed);
				}
			}
		}
	} catch (error) {
		return console.log(error);
	}
});

module.exports = router;
