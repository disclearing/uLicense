const Users = require('../models/userModel');
const Blacklist = require('../models/blacklistModel');
const Dailyrequests = require('../models/requestModel');
const Licensehistory = require('../models/licensehistoryModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../middleware/crypto');
const isIp = require('is-ip');
const axios = require('axios');
const moment = require('moment');
const userCtrl = {
	login: async (req, res) => {
		try {
			const { email, password } = req.body;
			const user = await Users.findOne({
				email: email,
			});
			if (!user)
				return res
					.status(400)
					.json({ msg: 'Email or password is wrong.' });
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res
					.status(400)
					.json({ msg: 'Email or password is wrong.' });
			}
			const refresh_token = createRefreshToken({ id: user._id });
			res.cookie('refreshtoken', refresh_token, {
				httpOnly: true,
				path: '/user/refresh_token',
				expiresIn: 7 * 24 * 60 * 60 * 1000,
			});
			let nowDate = new Date().toLocaleDateString();
			let nowTime = new Date()
				.toLocaleTimeString()
				.toString()
				.slice(0, -3);
			let nowFinal = `${nowDate} / ${nowTime}`;
			await Users.updateOne(
				{
					_id: user._id,
				},
				{
					$set: {
						lastlogin: nowFinal,
					},
				}
			);
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] User logged in`
			);
			return res.json({ msg: 'Login success!' });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getAccessToken: (req, res) => {
		try {
			const rf_token = req.cookies.refreshtoken;
			if (!rf_token)
				return res.status(400).json({ msg: 'Please login now!' });

			jwt.verify(
				rf_token,
				process.env.REFRESH_TOKEN_SECRET,
				(err, user) => {
					if (err)
						return res
							.status(400)
							.json({ msg: 'Please login now!' });

					const access_token = createAccessToken({ id: user.id });
					res.json({ access_token });
				}
			);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	updatePassword: async (req, res) => {
		try {
			const { useremail, currentpassword, password } = req.body;

			const passworduser = await Users.findOne({ email: useremail });

			if (
				!(await bcrypt.compare(currentpassword, passworduser.password))
			) {
				return res
					.status(500)
					.json({ msg: 'Old password did not match!' });
			} else {
				let passwordHash = await bcrypt.hash(password, 12);
				await Users.findOneAndUpdate(
					{ _id: req.user.id },
					{
						password: passwordHash,
					}
				);

				res.json({ msg: 'Password successfully changed!' });
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getUserInfor: async (req, res) => {
		try {
			const user = await Users.findById(req.user.id).select(
				'-password -licenses'
			);

			res.json(user);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getUsersAllInfor: async (req, res) => {
		try {
			const users = await Users.find().select('-password -licenses');

			res.json(users);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	logout: async (req, res) => {
		try {
			res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] User logged out!`
			);
			return res.json({ msg: 'Logged out.' });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	updateUser: async (req, res) => {
		try {
			const { discordwebhook, DiscordID } = req.body;
			if (discordwebhook) {
				const check = await Users.findOne({
					discordwebhook: discordwebhook,
				});
				if (check) {
					return res
						.status(400)
						.json({ msg: 'You already have that webhook.' });
				} else {
					await Users.findByIdAndUpdate(
						{ _id: req.user.id },
						{ $set: { discordwebhook: discordwebhook } }
					);
					await console.log(
						`\u001b[36m=> [${new Date().toLocaleTimeString()}] User updated webhook!`
					);
					return res.json({ msg: 'Update Success!' });
				}
			}
			if (DiscordID) {
				const check = await Users.findOne({ DiscordID: DiscordID });
				if (check) {
					return res
						.status(400)
						.json({ msg: 'This DiscordID already exists.' });
				}
				if (isNaN(DiscordID)) {
					return res
						.status(400)
						.json({ msg: 'That DiscordID is invalid.' });
				} else {
					await Users.findByIdAndUpdate(
						{ _id: req.user.id },
						{ $set: { DiscordID: DiscordID } }
					);
					await console.log(
						`\u001b[36m=> [${new Date().toLocaleTimeString()}] User updated DiscordID!`
					);
					return res.json({ msg: 'Update Success!' });
				}
			} else {
				return res.status(500).json({ msg: 'Error occurred' });
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	addLicenseData: async (req, res) => {
		try {
			const {
				licensekey,
				IPcap,
				HWIDcap,
				expires,
				pluginname,
				preIPlist,
				description,
				clientname,
			} = req.body;

			if (!licensekey || !IPcap || !expires || !clientname) {
				return res
					.status(400)
					.json({ msg: 'Please fill in required fields' });
			}
			if (licensekey.length < 19) {
				return res.status(400).json({
					msg: 'License key must be at least 19 characters',
				});
			}

			const User = await Users.findOne({
				role: 0,
				email: process.env.LOGIN_EMAIL,
			});

			let licenseQuery = [];
			for (let k = 0; k < User.licenses.length; k++) {
				let licenseToSearch = User.licenses[k].licensekey;
				licenseQuery.push(decrypt(licenseToSearch));
			}

			if (licenseQuery.includes(licensekey)) {
				return res
					.status(400)
					.json({ msg: 'You already have added this license!' });
			}

			const encryptKey = encrypt(licensekey);
			const timestamp = new Date();
			let latestrequest = 'None';
			let latestip = 'None';
			let iplistFinal;
			if (preIPlist === '' || preIPlist === undefined) {
				iplistFinal = [];
			} else if (preIPlist.length > 0) {
				let preIParray = preIPlist.replace(/\s/g, '').split(',');
				if (preIParray.length > IPcap) {
					return res
						.status(400)
						.json({ msg: 'You cant have more IPs than IP-cap!' });
				}
				for (let z = 0; z < preIParray.length; z++) {
					let testedIP = preIParray[z];
					if (isIp.v4(testedIP) === false) {
						return res
							.status(400)
							.json({ msg: 'Pre-defined IPs are invalid!' });
					}
				}
				iplistFinal = preIPlist.replace(/\s/g, '').split(',');
			}

			if (isNaN(HWIDcap)) {
				return res
					.status(400)
					.json({ msg: 'HWID-cap must be a number!' });
			}

			let clientnameFinal;
			let discordID;
			if (isNaN(clientname) === false && clientname.length === 18) {
				await axios
					.get(`https://discordapp.com/api/users/${clientname}`, {
						headers: {
							Authorization: `Bot ${process.env.BOT_TOKEN}`,
						},
					})
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
				return res
					.status(400)
					.json({ msg: "Couldn't find that DiscordID!" });
			} else if (clientnameFinal === undefined) {
				clientnameFinal = clientname;
			}
			if (discordID == undefined) {
				discordID = 'None';
			}

			let HWIDcapFinal;
			if (HWIDcap === '') {
				HWIDcapFinal = 'None';
			} else {
				HWIDcapFinal = HWIDcap;
			}

			let licenses = {
				licensekey: encryptKey,
				IPcap,
				HWIDcap: HWIDcapFinal,
				expires,
				pluginname,
				description,
				clientname: clientnameFinal,
				discordID: discordID,
				timestamp,
				latestrequest,
				latestip,
				IPlist: iplistFinal,
			};

			await Users.findOneAndUpdate(
				{ role: 0, email: process.env.LOGIN_EMAIL },
				{
					$push: {
						licenses,
					},
				}
			);
			let now = new Date();
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
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] New license added!`
			);
			return res.json({
				msg: 'License successfully created.',
			});
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	updateLicenseData: async (req, res) => {
		try {
			let oldLicense = req.body.oldData[0];
			let oldDiscordID = req.body.oldData[7];
			let oldClientName = req.body.oldData[4];
			let oldData = req.body.oldData;
			let newData = req.body.newData;
			let licensekey, ipcap, expires, desc, client, plugin, HWIDcap;
			[
				licensekey,
				ipcap,
				expires,
				desc,
				client,
				plugin,
				HWIDcap,
			] = newData;

			let modifyCheck;
			for (let x = 0; x < oldData.length; x++) {
				if (oldData[x] != newData[x]) {
					modifyCheck = true;
					break;
				} else {
					modifyCheck = false;
				}
			}
			if (modifyCheck === false) {
				return res
					.status(500)
					.json({ msg: "Didn't notice any changes!" });
			}
			if (licensekey.length < 19) {
				return res
					.status(500)
					.json({ msg: 'License key is too short!' });
			} else if (licensekey.length >= 30) {
				return res
					.status(500)
					.json({ msg: 'License key is too long!' });
			} else if (isNaN(ipcap) === true || ipcap.length < 1 || ipcap < 1) {
				return res.status(500).json({ msg: 'Invalid IP-cap!' });
			} else if (
				(HWIDcap.toLowerCase() !== 'none' && isNaN(HWIDcap) === true) ||
				HWIDcap.length < 1 ||
				HWIDcap < 1
			) {
				return res.status(500).json({ msg: 'Invalid HWID-cap!' });
			} else if (
				expires !== null &&
				moment(expires, true).isValid() !== true &&
				expires.toLowerCase() !== 'never'
			) {
				return res.status(500).json({ msg: 'Invalid expiry date!' });
			} else if (desc.length > 40) {
				return res
					.status(500)
					.json({ msg: 'Description is too long!' });
			} else if (client.length > 30 || client.length < 3) {
				return res
					.status(500)
					.json({ msg: 'Invalid client name length!' });
			} else if (plugin.length > 20) {
				return res
					.status(500)
					.json({ msg: 'Invalid plugin name length!' });
			} else {
				let licenseToEdit;
				let User = await Users.findOne({
					role: 0,
					email: process.env.LOGIN_EMAIL,
				});
				for (let f = 0; f < User.licenses.length; f++) {
					let licenseToSearch = User.licenses[f].licensekey;
					let key = decrypt(licenseToSearch);
					if (key === oldLicense) {
						licenseToEdit = licenseToSearch;
						break;
					}
				}

				let expiresFinal;
				if (
					expires === null ||
					expires.toString() === '9999-09-08T21:00:00.000Z'
				) {
					expiresFinal = 'Never';
				} else {
					expiresFinal = expires;
				}

				let clientnameFinal;
				let discordID;
				if (isNaN(client) === false && client.length === 18) {
					await axios
						.get(`https://discordapp.com/api/users/${client}`, {
							headers: {
								Authorization: `Bot ${process.env.BOT_TOKEN}`,
							},
						})
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
									`\u001b[36m=> [${new Date().toLocaleTimeString()}] Invalid DiscordID while editing license!`
								);
							}
						});
				}
				if (clientnameFinal === 'NOT_FOUND') {
					return res
						.status(400)
						.json({ msg: "Couldn't find that DiscordID!" });
				}
				if (clientnameFinal === undefined) {
					clientnameFinal = client;
				}
				if (discordID === undefined) {
					discordID = 'None';
				}

				let HWIDcapFinal;
				if (HWIDcap.toLowerCase() === 'none') {
					HWIDcapFinal = 'None';
				} else {
					HWIDcapFinal = HWIDcap;
				}

				let licenseNew = encrypt(licensekey);
				if (oldClientName === client) {
					await Users.findOneAndUpdate(
						{
							role: 0,
							email: process.env.LOGIN_EMAIL,
							'licenses.licensekey': licenseToEdit,
						},
						{
							$set: {
								'licenses.$.licensekey': licenseNew,
								'licenses.$.IPcap': ipcap,
								'licenses.$.expires': expiresFinal,
								'licenses.$.description': desc,
								'licenses.$.clientname': clientnameFinal,
								'licenses.$.pluginname': plugin,
								'licenses.$.HWIDcap': HWIDcapFinal,
							},
						}
					);
					return res.json({
						msg: 'Update success',
						discordID: oldDiscordID,
						clientname: clientnameFinal,
					});
				} else {
					await Users.findOneAndUpdate(
						{
							role: 0,
							email: process.env.LOGIN_EMAIL,
							'licenses.licensekey': licenseToEdit,
						},
						{
							$set: {
								'licenses.$.licensekey': licenseNew,
								'licenses.$.IPcap': ipcap,
								'licenses.$.expires': expiresFinal,
								'licenses.$.description': desc,
								'licenses.$.clientname': clientnameFinal,
								'licenses.$.pluginname': plugin,
								'licenses.$.discordID': discordID,
								'licenses.$.HWIDcap': HWIDcapFinal,
							},
						}
					);
					return res.json({
						msg: 'Update success',
						discordID: discordID,
						clientname: clientnameFinal,
					});
				}
			}
		} catch (error) {
			console.log(error);
			return res.status(500).json({ msg: error.message });
		}
	},
	deleteLicenseData: async (req, res) => {
		try {
			let licensekey = req.body.licensekey;
			let User = await Users.findOne({
				role: 0,
				email: process.env.LOGIN_EMAIL,
			});
			let licenseToDelete;
			for (let f = 0; f < User.licenses.length; f++) {
				let licenseToSearch = User.licenses[f].licensekey;
				let key = decrypt(licenseToSearch);
				if (key === licensekey) {
					licenseToDelete = licenseToSearch;
					break;
				}
			}

			await Users.findOneAndUpdate(
				{ role: 0, email: process.env.LOGIN_EMAIL },
				{
					$pull: {
						licenses: { licensekey: licenseToDelete },
					},
				}
			);
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] License deleted!`
			);
			return res.json({ msg: 'Deleted Success!' });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getLatestRequests: async (req, res) => {
		try {
			let User = await Users.findOne({
				role: 0,
				email: process.env.LOGIN_EMAIL,
			});
			let licenses = [];
			for (let l = 0; l < User.licenses.length; l++) {
				let licenseToSearch = User.licenses[l];
				licenseToSearch.licensekey = decrypt(
					licenseToSearch.licensekey
				);
				licenses.push(licenseToSearch);
			}

			let listaPRE = licenses.filter(function (filter) {
				return (
					filter.latestrequest !== 'none' &&
					filter.latestrequest !== 'None'
				);
			});
			/* Tämä loggaukseen */
			let listaFINAL = listaPRE
				.sort((a, b) => (b.latestrequest > a.latestrequest ? 1 : -1))
				.slice(0, 10);

			/* Tämä myös loggaukseen */
			let customersPRE = licenses
				.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
				.slice(0, 10);

			return res.json([listaFINAL, customersPRE]);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getLicenseData: async (req, res) => {
		try {
			const page = parseInt(req.query.page);
			const limit = parseInt(req.query.limit);
			const query = req.query.query;
			const startIndex = (page - 1) * limit;
			const endIndex = page * limit;

			const results = {};

			let User = await Users.findOne({
				role: 0,
				email: process.env.LOGIN_EMAIL,
			});
			let licenses = [];
			for (let l = 0; l < User.licenses.length; l++) {
				let licenseToSearch = User.licenses[l];
				if (query === '' || query === undefined) {
					licenseToSearch.licensekey = decrypt(
						licenseToSearch.licensekey
					);
					licenses.push(licenseToSearch);
				} else {
					licenseToSearch.licensekey = decrypt(
						licenseToSearch.licensekey
					);
					if (
						licenseToSearch.licensekey
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						licenseToSearch.clientname
							.toLowerCase()
							.includes(query.toLowerCase())
					) {
						licenses.push(licenseToSearch);
					}
				}
			}
			if (endIndex < licenses.length) {
				results.next = {
					page: page + 1,
					limit: limit,
				};
			}
			if (startIndex > 0) {
				results.prev = {
					page: page - 1,
					limit: limit,
				};
			}
			results.results = licenses.slice(startIndex, endIndex);
			return res.json(results);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	addSubuserData: async (req, res) => {
		try {
			const { subuserName, subuserEmail, subuserPassword } = req.body;
			if (subuserName && subuserEmail && subuserPassword) {
				let exists = await Users.findOne({
					email: subuserEmail,
				});
				if (exists) {
					return res
						.status(400)
						.json({ msg: 'This user already exists!' });
				} else {
					let passwordHashed = await bcrypt.hash(subuserPassword, 12);
					const newSubuser = new Users({
						name: subuserName,
						email: subuserEmail,
						password: passwordHashed,
						role: 1,
						DiscordID: 'none',
					});
					await newSubuser.save();
					return res.json({
						msg: 'Sub-user added.',
					});
				}
			} else {
				return console.log('Why you bully me');
			}
		} catch (error) {
			console.log(error);
		}
	},
	updateSubuser: async (req, res) => {
		try {
			let oldEmail = req.body.oldData[1];
			let oldData = req.body.oldData;
			let newData = req.body.newData;
			let name, email;
			[name, email] = newData;

			let modifyCheck;
			for (let x = 0; x < oldData.length; x++) {
				if (oldData[x] != newData[x]) {
					modifyCheck = true;
					break;
				} else {
					modifyCheck = false;
				}
			}
			if (modifyCheck === false) {
				return res
					.status(500)
					.json({ msg: 'Didnt notice any changes!' });
			}
			let emailCheck = await Users.findOne({ email: email });
			if (emailCheck && oldEmail !== email) {
				return res
					.status(500)
					.json({ msg: 'That email already exists!' });
			}
			await Users.findOneAndUpdate(
				{
					role: 1,
					email: oldEmail,
				},
				{
					$set: {
						email: email,
						name: name,
					},
				}
			);
			return res.json({ msg: 'Update success!' });
		} catch (error) {}
	},
	getSubuserData: async (req, res) => {
		try {
			let Subuser = await Users.find({ role: 1 });
			return res.json(Subuser);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	deleteSubuserData: async (req, res) => {
		let subuserEmail = req.body.subuserEmail;
		try {
			await Users.findOneAndDelete({ email: subuserEmail });
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] Sub-user deleted!`
			);
			return res.json({ msg: 'Deleted Success!' });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	addBlacklistData: async (req, res) => {
		try {
			const { blacklistedIP } = req.body;
			if (blacklistedIP) {
				let exists = await Blacklist.findOne({
					blacklisted: blacklistedIP,
				});
				if (exists) {
					return res
						.status(400)
						.json({ msg: 'That IP/HWID is already blacklisted!' });
				} else {
					if (isIp.v4(blacklistedIP)) {
						var region = await axios
							.get(
								`https://proxycheck.io/v2/${blacklistedIP}?vpn=1&asn=1`
							)
							.then(
								(resp) =>
									`${resp.data[blacklistedIP].country} / ${resp.data[blacklistedIP].continent}`
							)
							.catch((err) => console.log(err));
					} else {
						var region = 'Not specified';
					}
					const newBlacklist = new Blacklist({
						blacklisted: blacklistedIP,
						requests: 0,
						region: region,
					});
					await newBlacklist.save();
					await console.log(
						`\u001b[36m=> [${new Date().toLocaleTimeString()}] New blacklist added!`
					);
					return res.json({
						msg: 'Blacklist successfully added.',
					});
				}
			}
		} catch (error) {
			return;
		}
	},
	getBlacklistData: async (req, res) => {
		try {
			let Blacklisted = await Blacklist.find();
			return res.json(Blacklisted);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getClientNames: async (req, res) => {
		try {
			let users = await Users.findOne({
				role: 0,
				email: process.env.LOGIN_EMAIL,
			});
			let finalnumber = [];
			for (let b = 0; b < users.licenses.length; b++) {
				let clientToCheck = users.licenses[b];
				if (
					clientToCheck.discordID &&
					isNaN(clientToCheck.discordID) === false &&
					clientToCheck.discordID.length === 18
				) {
					if (
						process.env.BOT_TOKEN &&
						process.env.BOT_TOKEN !== 'YOUR_DISCORD_TOKEN'
					) {
						await axios
							.get(
								`https://discordapp.com/api/users/${clientToCheck.discordID}`,
								{
									headers: {
										Authorization: `Bot ${process.env.BOT_TOKEN}`,
									},
								}
							)
							.then(async (res) => {
								await Users.updateMany(
									{
										email: process.env.LOGIN_EMAIL,
										role: 0,
										'licenses.discordID': res.data.id,
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
											{ 'elem.discordID': res.data.id },
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
					} else {
						return res.json({
							msg: `No Discord bot token provided!`,
						});
					}
				}
			}
			if (finalnumber.reduce((a, b) => a + b, 0) > 0) {
				return res.json({
					msg: `Updated ${finalnumber.reduce(
						(a, b) => a + b,
						0
					)} names. Refresh the page!`,
				});
			} else {
				return res.json({
					msg: `Didn't find any name changes!`,
				});
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	deleteBlacklistData: async (req, res) => {
		let blacklistedIP = req.body.blacklisted;
		try {
			await Blacklist.findOneAndDelete({ blacklisted: blacklistedIP });
			await console.log(
				`\u001b[36m=> [${new Date().toLocaleTimeString()}] Blacklist deleted!`
			);
			return res.json({ msg: 'Deleted Success!' });
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getRequestsData: async (req, res) => {
		try {
			let allDays = await Last7Days();

			const foundDatesFromDB = await Dailyrequests.find({
				date: allDays,
			});
			if (foundDatesFromDB) {
				let results = [];
				let results2 = [];
				for (let i = 0; i < allDays.length; i++) {
					let dateToSearch = allDays[i];
					let requestsFound = 0;
					let rejectedFound = 0;
					for (let j = 0; j < foundDatesFromDB.length; j++) {
						let requestData = foundDatesFromDB[j];
						if (requestData.date != null) {
							if (requestData.date === dateToSearch) {
								rejectedFound =
									requestData.rejected == null
										? 0
										: requestData.rejected;
								requestsFound =
									requestData.requests == null
										? 0
										: requestData.requests;
								break;
							}
						}
					}
					await results.push(requestsFound);
					await results2.push(rejectedFound);
				}
				return await res.json([results, results2]);
			} else {
				await res.json([
					[0, 0, 0, 0, 0, 0, 0],
					[0, 0, 0, 0, 0, 0, 0],
				]);
				return await console.log(
					`\u001b[36m=> [${new Date().toLocaleTimeString()}] License database is empty!`
				);
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
	getYearlyCustomers: async (req, res) => {
		try {
			let now = new Date();
			const getYear = await Licensehistory.findOne({
				year: now.getFullYear(),
			}).select('-year -_id -__v');

			if (getYear) {
				const listaYearly = [
					getYear.january,
					getYear.february,
					getYear.march,
					getYear.april,
					getYear.may,
					getYear.june,
					getYear.july,
					getYear.august,
					getYear.september,
					getYear.october,
					getYear.november,
					getYear.december,
				];
				await res.json(listaYearly);
			} else {
				await res.json([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
				return await console.log(
					`\u001b[36m=> [${new Date().toLocaleTimeString()}] No yearly data in database!`
				);
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	},
};
const Last7Days = async () => {
	var result = [];
	for (var i = 0; i < 7; i++) {
		var d = new Date();
		d.setDate(d.getDate() - i);
		result.push(d.toLocaleDateString());
	}

	return result;
};

const createAccessToken = (payload) => {
	return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: '15m',
	});
};

const createRefreshToken = (payload) => {
	return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: '1h',
	});
};

module.exports = userCtrl;
