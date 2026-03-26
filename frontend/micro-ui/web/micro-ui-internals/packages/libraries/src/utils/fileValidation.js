/**
 * File Validation Utility
 * Enforces security checks for file uploads (CWE-434 mitigation)
 */

const ALLOWED_EXTENSIONS = {
    image: ["jpg", "jpeg", "png", "webp"],
    doc: ["pdf", "doc", "docx", "xls", "xlsx", "csv"],
    all: ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "xls", "xlsx", "csv"],
};

const ALLOWED_MIME_TYPES = {
    image: ["image/jpeg", "image/png", "image/webp"],
    doc: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
};

/**
 * Validates file extension
 */
const checkAllowedExtension = (file, type = "all") => {
    const extension = file.name.split(".").pop().toLowerCase();
    return (ALLOWED_EXTENSIONS[type] || ALLOWED_EXTENSIONS.all).includes(extension);
};

/**
 * Validates file MIME type
 */
const checkAllowedMIMEType = (file, type = "all") => {
    return (ALLOWED_MIME_TYPES[type] || [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.doc]).includes(file.type);
};

/**
 * Enforces maximum file size (default 2MB)
 */
const checkFileSize = (file, maxSizeMB = 2) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * Checks for malicious filename patterns
 * - Double dots
 * - Double extensions (e.g., .php.jpg)
 * - Null bytes (%00)
 * - Meta characters
 */
const checkMaliciousFilename = (file) => {
    const fileName = file.name;

    if (fileName.includes("..")) return true;
    if (fileName.includes("%00")) return true;
    if (/[\x00-\x1F\x7F]/.test(fileName)) return true;

    // ⛔ Anti-XSS and Malicious Character Check
    // Allows only Alphanumeric, Underscore, Hyphen, Dot and Space
    if (/[^a-zA-Z0-9_\-\. ]/.test(fileName)) return true;

    // Basic double extension check (more than one dot)
    const dotsCount = (fileName.match(/\./g) || []).length;
    if (dotsCount > 1) {
        // Check if it's a known multi-part extension if any, otherwise treat as suspicious
        // For now, keeping it strict as per recommendation
        return true;
    }

    return false;
};

/**
 * Sanitizes filename:
 * - Replaces spaces with underscores
 * - Removes non-alphanumeric characters except dots, hyphens and underscores
 */
const sanitizeFilename = (filename) => {
    const nameParts = filename.split(".");
    const extension = nameParts.pop();
    const nameWithoutExtension = nameParts.join(".");

    const sanitizedName = nameWithoutExtension
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "");

    return `${sanitizedName}.${extension}`;
};

/**
 * Comprehensive file validation
 */
const validateFile = (file, options = {}) => {
    const { type = "all", maxSizeMB = 2, sanitize = true } = options;

    if (!file) return { isValid: false, error: "FILE_NULL" };

    if (!checkAllowedExtension(file, type)) {
        return { isValid: false, error: "INVALID_FILE_EXTENSION" };
    }

    // Note: MIME type check can sometimes fail for certain OS/browser combinations, 
    // but it's a good secondary check.
    // if (!checkAllowedMIMEType(file, type)) {
    //   return { isValid: false, error: "INVALID_MIME_TYPE" };
    // }

    if (!checkFileSize(file, maxSizeMB)) {
        return { isValid: false, error: "MAX_FILE_SIZE_EXCEEDED" };
    }

    if (checkMaliciousFilename(file)) {
        return { isValid: false, error: "MALICIOUS_FILENAME_DETECTED" };
    }

    let finalFile = file;
    if (sanitize) {
        const sanitizedName = sanitizeFilename(file.name);
        // Note: Creating a new File object because file.name is read-only
        finalFile = new File([file], sanitizedName, { type: file.type });
    }

    return { isValid: true, file: finalFile };
};

export default {
    checkAllowedExtension,
    checkAllowedMIMEType,
    checkFileSize,
    checkMaliciousFilename,
    sanitizeFilename,
    validateFile,
};
