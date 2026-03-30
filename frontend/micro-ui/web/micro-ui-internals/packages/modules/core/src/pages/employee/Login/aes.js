import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || "9f3c7a1d8e5b4c6f2a7d9e3c5b8f1a6d9f3c7a1d8e5b4c6f";

export const encryptAES = (plainText) => {
    if (!plainText) return "";

    // 1. Create a Cryptographically Secure Nonce using CryptoJS
    const nonce = CryptoJS.lib.WordArray.random(16).toString(); 
    const timestamp = new Date().toISOString();

    // 2. Format: Password|Nonce|Timestamp (Matches Java Backend)
    const dataToEncrypt = `${plainText}|${nonce}|${timestamp}`;

    const salt = CryptoJS.lib.WordArray.random(8);
    const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
        keySize: 256 / 32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA256
    });

    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    const combined = CryptoJS.enc.Utf8.parse("Salted__")
        .concat(salt)
        .concat(iv)
        .concat(encrypted.ciphertext);

    return encodeURIComponent(CryptoJS.enc.Base64.stringify(combined));
};

export const decryptAES = (cipherText) => {
    if (!cipherText) return "";
    try {
        const decodedStr = decodeURIComponent(cipherText);
        const combined = CryptoJS.enc.Base64.parse(decodedStr);
        const salt = CryptoJS.lib.WordArray.create(combined.words.slice(2, 4));
        const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8));
        const encryptedData = CryptoJS.lib.WordArray.create(
            combined.words.slice(8),
            combined.sigBytes - 32 
        );

        const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
            keySize: 256 / 32,
            iterations: 1000,
            hasher: CryptoJS.algo.SHA256,
        });

        const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedData }, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        const parts = decryptedStr.split("|");
        
        return parts.length >= 3 ? parts[0] : ""; 
    } catch (e) {
        return "";
    }
};
