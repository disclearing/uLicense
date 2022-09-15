module.exports = async (client) => {
	await client.user.setActivity(`${client.config.name}`);
	await console.log(`\u001b[36m`);
	await console.log(
		`    \u001b[36m╭────────────────────────────────────────╮`
	);
	await console.log(
		`    \u001b[36m│        \x1b[37muLicense - Discord bot          \u001b[36m│`
	);
	await console.log(
		`    \u001b[36m│                                        \u001b[36m│                  \x1b[37mMade by`
	);
	await console.log(
		`    \u001b[36m│          \x1b[37mVersion \x1b[36m1.2.6 \x1b[37m| BETA          \u001b[36m│                   \x1b[37mkassq`
	);
	await console.log(
		`    \u001b[36m│    \x1b[37mRun \x1b[36mnpm i \x1b[37mto update dependencies    \u001b[36m│`
	);
	await console.log(
		`    \u001b[36m╰────────────────────────────────────────╯`
	);
	await console.log(`\u001b[36m`);
	await console.log(`=> Serving ${client.guilds.cache.size} servers.`);
};
