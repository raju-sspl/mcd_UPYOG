import { UserService } from "../../../../../libraries/src/services/elements/User";
import axios from "axios";

export const logoutEGF = async () => {
  try {
    const user = UserService.getUser();
    if (!user || !user.access_token) {
      throw new Error("User or access token is missing");
    }

    const payload = {
      RequestInfo: {
        apiId: null,
        ver: null,
        ts: Math.floor(new Date().getTime() / 1000),
        action: null,
        did: null,
        key: null,
        msgId: null,
        authToken: user.access_token,
        correlationId: null,
        userInfo: null,
      },
    };

    const { protocol, hostname, port } = window.location;
    const baseHost = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    console.log(baseHost, "url");
    const clearTokenURL = `${baseHost}/services/EGF/rest/logout`;
    const response = await axios.post(clearTokenURL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (err) {
    return { error: err.message };
  }
};

export const logoutV2 = async () => {
  const userType = UserService.getType();
  try {
    await logoutEGF();
  } catch (e) {
    console.error("Error during logoutEGF:", e);
    } finally {
        window.localStorage.clear();
        window.sessionStorage.clear();

        if (userType === "citizen") {
            window.location.replace("/digit-ui/citizen");
        } else {
            window.location.replace("/digit-ui/employee/user/language-selection");
        }
  } 
};
