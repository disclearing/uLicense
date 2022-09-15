const Discord = require('discord.js');
const Users = require('../models/userDB.js');
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
					const successEmbed = new Discord.MessageEmbed()
						.setColor(`${client.config.embed_color}`)
						.setAuthor(
							`Requested by ${message.author.username}`,
							message.author.displayAvatarURL()
						)
						.setTitle(`${client.config.name} - Commands`, true)
						.addFields(
							{
								name: `${client.config.prefix}addlicense`,
								value:
									'Create new license with parameters like IPcap and Plugin name!',
							},
							{
								name: `${client.config.prefix}removelicense`,
								value: 'Remove existing license!',
							},
							{
								name: `${client.config.prefix}getlicense`,
								value: 'Get license details.',
							},
							{
								name: `${client.config.prefix}editlicense`,
								value: 'Edit existing license!',
							},
							{
								name: `${client.config.prefix}licenselist`,
								value: 'Get list of your licenses!',
							},
							{
								name: `${client.config.prefix}cleardata`,
								value:
									'Clear HWID/IP data for all/specific license(s)!',
							},
							{
								name: `${client.config.prefix}refreshclients`,
								value:
									'Refreshes client names that have a DiscordID!',
							},
							{
								name: `${client.config.prefix}setversion`,
								value:
									'Set version of your plugin. You can use this version to notify your customer if he is using outdated version of your application!',
							}
						)
						.addField(
							'\u200b',
							'**What is uLicense?**\nWe make it easy to license almost any application! Unique features, fair price point and fast support makes us an easy choice! Secure your application today! '
						)
						.addField(
							'\u200b',
							`❯ [｢McMarket｣](https://www.mc-market.org/resources/18736/)\n❯ [｢Support｣](https://discord.gg/YQnz8ymQmC)`
						)
						.setFooter(
							`${client.config.name} | Made by @kassq`,
							client.user.displayAvatarURL()
						);
					await message.channel
						.send(successEmbed)
						.then(async (msg) => {
							await msg.react('🆗');
						});
				} else {
					return await console.log(
						`${message.author.username} tried to use help.`
					);
				}
			}
		);
	}
};
