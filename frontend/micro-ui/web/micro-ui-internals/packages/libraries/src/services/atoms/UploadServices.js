import Axios from "axios";
import Urls from "./urls";
// Internal validation helper to avoid circular dependencies and ensure security
const validateFileInternal = (file) => {
  const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "xls", "xlsx", "csv"];
  const extension = file.name.split(".").pop().toLowerCase();
  const maxSizeBytes = 5 * 1024 * 1024; // Strict default 5MB for service layer

  if (!ALLOWED_EXT.includes(extension)) return { isValid: false, error: "INVALID_EXTENSION" };
  if (file.size > maxSizeBytes) return { isValid: false, error: "FILE_TOO_LARGE" };
  if (file.name.includes("..") || file.name.includes("%00") || /[\x00-\x1F\x7F]/.test(file.name)) return { isValid: false, error: "MALICIOUS_FILENAME" };

  // ⛔ Anti-XSS and Malicious Character Check
  if (/[^a-zA-Z0-9_\-\. ]/.test(file.name)) return { isValid: false, error: "MALICIOUS_CHARS_XSS" };

  if ((file.name.match(/\./g) || []).length > 1) return { isValid: false, error: "DOUBLE_EXTENSION" };

  return { isValid: true };
};

export const UploadServices = {
  Filestorage: async (module, filedata, tenantId) => {
    // Global Security Check
    const validation = validateFileInternal(filedata);
    if (!validation.isValid) {
      console.error(`File upload blocked by security policy: ${validation.error}`);
      throw new Error(`FILE_VALIDATION_FAILED_${validation.error}`);
    }

    const formData = new FormData();

    formData.append("file", filedata, filedata.name);
    formData.append("tenantId", tenantId);
    formData.append("module", module);
    let tenantInfo=window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")?`?tenantId=${tenantId}`:"";
    var config = {
      method: "post",
      url:`${Urls.FileStore}${tenantInfo}`,   
      data: formData,
      headers: { "auth-token": Digit.UserService.getUser() ? Digit.UserService.getUser()?.access_token : null},
    };

    return Axios(config);
  },

  MultipleFilesStorage: async (module, filesData, tenantId) => {
    const formData = new FormData();
    const filesArray = Array.from(filesData);

    for (const fileData of filesArray) {
      if (fileData) {
        // Global Security Check
        const validation = validateFileInternal(fileData);
        if (!validation.isValid) {
          console.error(`File upload blocked by security policy: ${validation.error}`);
          throw new Error(`FILE_VALIDATION_FAILED_${validation.error}`);
        }
        formData.append("file", fileData, fileData.name);
      }
    }

    formData.append("tenantId", tenantId);
    formData.append("module", module);
    let tenantInfo=window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")?`?tenantId=${tenantId}`:"";
    var config = {
      method: "post",
      url:`${Urls.FileStore}${tenantInfo}`, 
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data',"auth-token": Digit.UserService.getUser().access_token },
    };

    return Axios(config);
  },

  Filefetch: async (filesArray, tenantId) => {
    let tenantInfo=window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")?`?tenantId=${tenantId}`:"";
    var config = {
      method: "get",
      url:`${Urls.FileFetch}${tenantInfo}`, 
      params: {
        tenantId: tenantId,
        fileStoreIds: filesArray?.join(","),
      },
    };
    const res = await Axios(config);
    return res;
  },
};
