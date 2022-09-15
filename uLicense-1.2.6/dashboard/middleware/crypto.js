const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = process.env.ENCRYPT_SECRET;
const key = crypto
	.createHash('sha256')
	.update(String(secretKey))
	.digest('base64')
	.substr(0, 32);
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
	const cipher = crypto.createCipheriv(algorithm, key, iv);

	const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

	return {
		iv: iv.toString('hex'),
		content: encrypted.toString('hex'),
	};
};

const decrypt = (hash) => {
	const decipher = crypto.createDecipheriv(
		algorithm,
		key,
		Buffer.from(hash.iv, 'hex')
	);

	const decrpyted = Buffer.concat([
		decipher.update(Buffer.from(hash.content, 'hex')),
		decipher.final(),
	]);

	return decrpyted.toString();
};

module.exports = {
	encrypt,
	decrypt,
};
