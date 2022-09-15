const Discord = require('discord.js');
const { Collection } = require('discord.js');
const { readdir } = require('fs');
const client = new Discord.Client({
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const mongoose = require('mongoose');
client.config = require('./config.json');

const url = client.config.databaseURL;
mongoose.connect(url, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

mongoose.connection.on('connected', () => {
	console.log('Connected successfully to the database :)');
});
mongoose.connection.on('err', (err) => {
	console.error(
		`Error occurred while connecting to the database.\n${err.stack}`
	);
});
mongoose.connection.on('disconnected', () => {
	console.warn('Lost connection to the database');
});

readdir('./events/', (err, files) => {
	if (err) return console.log(err);
	files.forEach((file) => {
		const event = require(`./events/${file}`);
		let eventName = file.split('.')[0];
		client.on(eventName, event.bind(null, client));
	});
});

client.commands = new Collection();

readdir('./commands/', (err, files) => {
	if (err) return console.log(err);
	files.forEach((file) => {
		let commandName = file.split('.')[0];
		client.commands.set(commandName, require(`./commands/${file}`));
	});
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.message.partial) await reaction.message.fetch();
	if (reaction.partial) await reaction.fetch();
	if (!reaction.message.author.bot) return;
	if (user.bot) return;
	if (reaction.emoji.name == '🆗' && reaction.count > 1) {
		reaction.message.delete();
	}
});

client.login(client.config.token);
