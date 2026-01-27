import CryptoJS from "crypto-js";

const SECRET_KEY = "MySuperSecretEncryptionKe123456!";

export const encryptAES = (plainText) => {
    const encrypted = CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();

    return encodeURIComponent(encrypted);
};

export const decryptAES = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};
