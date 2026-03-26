import CryptoJS from "crypto-js";

const SECRET_KEY = "9f3c7a1d8e5b4c6f2a7d9e3c5b8f1a6d9f3c7a1d8e5b4c6f";

export const encryptAES = (plainText) => {
    if (!plainText) return "";
    
    const salt = CryptoJS.lib.WordArray.random(8);
    // PBKDF2 is the industry standard for Key Derivation
    const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
        keySize: 256/32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA256
    });

    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
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

    // 1. Decode URL and parse Base64 back to WordArray
    const decodedStr = decodeURIComponent(cipherText);
    const combined = CryptoJS.enc.Base64.parse(decodedStr);
    
    // Salt: words 2-4 (8 bytes)
    const salt = CryptoJS.lib.WordArray.create(combined.words.slice(2, 4));
    
    // IV: words 4-8 (16 bytes)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8));
    
    // Ciphertext: everything after word 8
    const encryptedData = CryptoJS.lib.WordArray.create(
        combined.words.slice(8),
        combined.sigBytes - 32 // 8 (header) + 8 (salt) + 16 (iv) = 32 bytes to subtract
    );

    // 3. Re-derive the key using PBKDF2
    const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
        keySize: 256/32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA256
    });

    // 4. Decrypt
    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedData },
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
};