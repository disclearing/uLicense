require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Users = require('./models/userModel.js');
const crypto = require('crypto');
const helmet = require('helmet');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(
	helmet({
		contentSecurityPolicy: false,
	})
);

app.use('/user', require('./routes/userRouter'));
app.use('/api', require('./routes/apiRouter'));
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', function (req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const URL = process.env.MONGODB_URL;
mongoose.connect(
	URL,
	{
		useCreateIndex: true,
		useFindAndModify: false,
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	(err) => {
		if (err) throw err;
		console.log(
			`=> [${new Date().toLocaleTimeString()}] Connected to MongoDB`
		);
	}
);

async function firstStart() {
	const name = process.env.LOGIN_NAME;
	const email = process.env.LOGIN_EMAIL;
	const password = process.env.LOGIN_PASSWORD;

	if (!name || !email || !password) {
		return await console.log('Please fill in login details in .env');
	}

	const passwordHash = await bcrypt.hash(password, 12);
	const defaultUser = await Users.findOne({ name: process.env.LOGIN_NAME });
	if (!defaultUser) {
		let APIkey = crypto.randomBytes(20).toString('hex');
		const newUser = new Users({
			name,
			email,
			password: passwordHash,
			APIkey,
		});
		await console.log(
			`=> [${new Date().toLocaleTimeString()}] This is your randomly created API key. If you need this later you can get this from database: ${APIkey}`
		);
		await newUser.save();
	}
}
firstStart();

const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, () =>
	console.log(
		`=> [${new Date().toLocaleTimeString()}] Server is running on port ${PORT}`
	)
);
console.log(`\u001b[36m`);
console.log(`    \u001b[36m╭────────────────────────────────────────╮`);
console.log(
	`    \u001b[36m│         \x1b[37muLicense - Dashboard           \u001b[36m│`
);
console.log(
	`    \u001b[36m│                                        \u001b[36m│                  \x1b[37mMade by`
);
console.log(
	`    \u001b[36m│          \x1b[37mVersion \x1b[36m1.2.6 \x1b[37m| BETA          \u001b[36m│                   \x1b[37mkassq`
);
console.log(
	`    \u001b[36m│    \x1b[37mRun \x1b[36mnpm i \x1b[37mto update dependencies    \u001b[36m│`
);
console.log(`    \u001b[36m╰────────────────────────────────────────╯`);
console.log(`\u001b[36m`);
