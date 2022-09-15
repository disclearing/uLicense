module.exports = (client, msg) => {
	if (msg.guild === null) return;
	if (msg.guild.id != client.config.serverID) return;
	if (msg.author.bot) return;
	if (msg.content.indexOf(client.config.prefix) !== 0) return;
	const args = msg.content
		.slice(client.config.prefix.length)
		.trim()
		.split(/ +/g);
	const command = client.commands.get(args.shift().toLowerCase());
	if (!command) return;
	console.log(
		`\u001b[36m=> [${new Date().toLocaleTimeString()}] ${
			msg.author.username
		} used ${msg.content} command!`
	);
	command.run(client, msg, args);
};
