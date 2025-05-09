const passwordHandler = require('../../utils/cryptoUtils');

async function hashPassword() {
    const password = 'ajiro2024';
    const salt = await passwordHandler.genSalt(10);
    const hashedPassword = await passwordHandler.hash(password, salt);
    console.log('Hashed password:', hashedPassword);
}

hashPassword(); 