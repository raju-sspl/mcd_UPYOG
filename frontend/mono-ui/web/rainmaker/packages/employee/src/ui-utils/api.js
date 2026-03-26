import axios from "axios";
import commonConfig from "config/common.js";
import { getTenantId ,getAccessToken} from "egov-ui-kit/utils/localStorageUtils";

const instance = axios.create({
  baseURL: window.location.origin,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginRequest = async (username = null, password = null) => {
  let apiError = "Api Error";
  try {
    // api call for login
    alert("Logged in");
    return;
  } catch (e) {
    apiError = e.message;
    // alert(e.message);
  }

  throw new Error(apiError);
};

export const logoutRequest = async () => {
  let apiError = "Api Error";
  try {
    alert("Logged out");
    return;
  } catch (e) {
    apiError = e.message;
    // alert(e.message);
  }

  throw new Error(apiError);
};

export const prepareForm = (params) => {
  let formData = new FormData();
  for (var k in params) {
    formData.append(k, params[k]);
  }
  return formData;
};

export const uploadFile = async (endPoint, module, file, ulbLevel) => {
  // Bad idea to fetch from local storage, change as feasible
  const tenantId = getTenantId() ? (ulbLevel ? commonConfig.tenantId : commonConfig.tenantId) : "";
  const uploadInstance = axios.create({
    baseURL: window.location.origin,
    headers: {
      "Content-Type": "multipart/form-data",
      "auth-token":getAccessToken(),
    },
  });

  const requestParams = {
    tenantId,
    module,
    file,
  };
  const requestBody = prepareForm(requestParams);

  try {
    const response = await uploadInstance.post(endPoint, requestBody);
    const responseStatus = parseInt(response.status, 10);
    let fileStoreIds = [];

    if (responseStatus === 201) {
      const responseData = response.data;
      const files = responseData.files || [];
      fileStoreIds = files.map((f) => f.fileStoreId);
      return fileStoreIds[0];
    }
  } catch (error) {
    throw new Error(error);
  }
};

export const fetchCaptcha = async () => {
  const captchaInstance = axios.create({
    baseURL: window.location.origin,
    headers: {
      "Content-Type": "application/json",
    },
  });

  try {
    const response = await captchaInstance.get("/user/api/captcha/image", {
      responseType: 'blob'
    });

    const responseStatus = parseInt(response.status, 10);

    if (responseStatus === 200 || responseStatus === 201) {
      // Convert blob to base64 data URL for display in <img> tag
      const blob = response.data;
      const imageUrl = URL.createObjectURL(blob);

      // Extract captchaId from response headers if provided
      const captchaId = response.headers['captcha-id'] || response.headers['x-captcha-id'] || '';

      return {
        captcha: imageUrl,
        captchaId: captchaId
      };
    }

  } catch (error) {
    const errDesc =
      (error &&
        error.response &&
        error.response.data &&
        error.response.data.error_description) ||
      "Captcha API failed";

    throw new Error(errDesc);
  }
};
