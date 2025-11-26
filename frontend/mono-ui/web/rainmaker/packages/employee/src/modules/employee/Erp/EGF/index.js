import React, { Component } from "react";
import { getTenantId, getAccessToken } from "egov-ui-kit/utils/localStorageUtils";
import { setSessionTTL } from "egov-ui-kit/redux/app/actions";
import { connect } from "react-redux";
import { logout } from "egov-ui-kit/redux/auth/actions";
class EGFFinance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ttl: null,
      warningShown: false,
      isLoading: true,
      lastUrl: null, // track last loaded URL
    };
    // this.onFrameLoad = this.onFrameLoad.bind(this);
    // this.resetIframe = this.resetIframe.bind(this);
    // this.fetchTTL = this.fetchTTL.bind(this);
  }
  /** Called when iframe finishes loading */
  onFrameLoad = () => {
    this.setState({ isLoading: false });
    this.fetchTTL();
  };

  startCountdown(ttlSeconds) {
    clearInterval(this.countdownInterval);

    // compute absolute expiry time
    const expiryTime = Date.now() + ttlSeconds * 1000;

    this.countdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));

      // dispatch only when there's an actual change
      this.props.setSessionTTL(remaining);

      if (remaining <= 0) {
        this.handleSessionExpired();
      }
    }, 1000);
  }


async fetchTTL() {
  try {
    const tenantIdFull = getTenantId(); 
    const tenantParts = tenantIdFull.split('.');
    const cityCode = tenantParts.length > 1 ? tenantParts[1] : undefined;  // e.g. "pg.city"
    const baseProxy = process.env.REACT_APP_BASE_PROXY; 
    const parsedURL = new URL(baseProxy);
    const domain = parsedURL.hostname;
    const protocol = parsedURL.protocol; 

    // Construct URL dynamically based on tenant and environment
    const TtlUrl = `${protocol}//${cityCode}-${domain}/services/EGF/session/ttl`; 
    // const localhost = "http://mcd.localhost:9090/services/EGF/session/ttl"; // for local dev only
    const response = await fetch(TtlUrl, { credentials: "include" });
    if (!response.ok) {
      console.warn("TTL API responded with status:", response.status);
      this.handleSessionExpired();
      return;
    }
    const data = await response.json();
    if (data && typeof data.ttl === "number") {
      clearInterval(this.countdownInterval);
      this.startCountdown(data.ttl);
      window.dispatchEvent(new CustomEvent("sessionRefreshComplete"));
    } else {
      console.warn("Unexpected TTL response format:", data);
    }
  } catch (error) {
    // Don't show raw errors on UI — just log silently for debugging
    console.warn("Failed to fetch TTL:", error.message);
    this.handleSessionExpired();
  }
}
  async handleSessionExpired() {
    // Optional: clear any running timers
    clearInterval(this.countdownInterval);

    // Show alert or toast
    // alert("Your session has expired. Please log in again.");

    try {
    // Attempt Redux logout (await ensures it completes)
    if (this.props && this.props.logout) {
      await this.props.logout();
    }

    // Clean local/session storage
    localStorage.clear();
    sessionStorage.clear();

    // Finally redirect to proper login path
    window.location.replace("/digit-ui/employee/user/login");
  } catch (err) {
    console.error("Logout failed:", err);

    // Fallback: still redirect
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/digit-ui/employee/user/login");
  }
  }
  /** Submit the hidden form to iframe */
  submitIframeForm = () => {
    const form = document.forms["erp_form"];
    if (form) {
      console.log("Submitting Finance iframe form...");
      form.submit();
    }
  };

  render() {
    const { isLoading } = this.state;
    let auth_token = getAccessToken(),
    locale = localStorage.getItem("locale"),
    menuUrl = this.props.location.pathname,
    loc = window.location,
    subdomainurl,
    domainurl,
    finEnv,
    hostname = loc.hostname,
    winheight = window.innerHeight - 100,
    erp_url,
    tenantId = getTenantId();
    
    //Reading domain name from the request url
    domainurl = hostname.substring(hostname.indexOf(".") + 1);
    // Reading environment name (ex: dev, qa, uat, fin-uat etc) from the globalconfigs if exists else reading from the .env file
    finEnv = this.globalConfigExists() ? window.globalConfigs.getConfig("FIN_ENV") : process.env.REACT_APP_FIN_ENV;
    // Preparing finance subdomain url using the above environment name and the domain url
    subdomainurl = !!(finEnv) ? "-" + finEnv + "." + domainurl : "." + domainurl;
    erp_url = loc.protocol + "//" + getTenantId().split(".")[1] + subdomainurl + menuUrl;
    console.log("Finance Iframe URL:", erp_url);
    return (
      <div style={{ position: "relative", minHeight: winheight }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              zIndex: 9999,
              flexDirection: "column",
            }}
          >
            <div className="bar-loader">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            {/* <p style={{ marginTop: "10px", fontSize: "14px", color: "#444" }}>
              Processing your request. Please wait...
            </p> */}
            <style>{`
      .bar-loader {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 50px;
        height: 30px;
      }

      .bar-loader div {
        width: 6px;
        height: 100%;
        background-color: #2b547cff; /* DIGIT blue */
        border-radius: 2px;
        animation: barWave 1.2s infinite ease-in-out;
      }

      .bar-loader div:nth-child(1) { animation-delay: 0s; }
      .bar-loader div:nth-child(2) { animation-delay: 0.1s; }
      .bar-loader div:nth-child(3) { animation-delay: 0.2s; }
      .bar-loader div:nth-child(4) { animation-delay: 0.3s; }
      .bar-loader div:nth-child(5) { animation-delay: 0.4s; }

      @keyframes barWave {
        0%, 40%, 100% {
          transform: scaleY(0.4);
        }
        20% {
          transform: scaleY(1);
        }
      }
    `}</style>
          </div>
        )}

        <iframe name="erp_iframe" id="erp_iframe" height={winheight} width="100%" style={{display: isLoading ? "none" : "block",border: "none"}} />
        <form action={erp_url} id="erp_form" method="post" target="erp_iframe">
          <input readOnly hidden="true" name="auth_token" value={auth_token} />
          <input readOnly hidden="true" name="tenantId" value={tenantId} />
          <input readOnly hidden="true" name="locale" value={locale} />
	  <input readOnly hidden="true" name="formPage" value="true" />
        </form>
      </div>
    );
  }
  componentDidMount() {
    window.addEventListener("message", this.onMessage, false);
    window.addEventListener("loacaleChangeEvent", this.resetIframe, false);
    window.addEventListener("refreshSession", this.fetchTTL.bind(this));
    const iframe = document.getElementById("erp_iframe");
    iframe.addEventListener("load", this.onFrameLoad);

    // First time submit
    this.loadFinanceIframe();
  }
  componentDidUpdate(prevProps) {
    let isSecure = window.location.protocol === "https";
    let localeCookie = "locale=" + localStorage.getItem("locale") + ";path=/;domain=." + this.getSubdomain();
    if (isSecure) {
      localeCookie += ";secure";
    }
    window.document.cookie = localeCookie;
    // document.forms["erp_form"].submit();
    const currentUrl = this.props.location.pathname;
    if (currentUrl !== prevProps.location.pathname) {
      // Only when URL (menu) changes
      this.loadFinanceIframe();
    }
  }

  /** Handle Finance module load */
  loadFinanceIframe() {
    const menuUrl = this.props.location.pathname;
    const loc = window.location;
    const hostname = loc.hostname;
    const domainurl = hostname.substring(hostname.indexOf(".") + 1);

    // Read environment name from global configs or .env file
    const finEnv = this.globalConfigExists() ? window.globalConfigs.getConfig("FIN_ENV") : process.env.REACT_APP_FIN_ENV;

    // Construct subdomain dynamically
    const subdomainurl = finEnv ? `-${finEnv}.${domainurl}` : `.${domainurl}`;

    const erp_url =
      loc.protocol + "//" + getTenantId().split(".")[1] + subdomainurl + menuUrl;

    this.setState({ isLoading: true, lastUrl: menuUrl }, () => {
      const form = document.getElementById("erp_form");
      if (form) form.action = erp_url;
      this.submitIframeForm();
    });
    // console.log("Loading Finance Iframe URL:", erp_url);
  }
  onMessage = (event) => {
    if (event.data != "close") return;
    // document.getElementById('erp_iframe').style.display='none';
    this.props.history.push("/inbox");
  };
  resetIframe = () => {
    console.log("Resetting iframe...");
    this.setState({ isLoading: true });
    this.loadFinanceIframe();
  };
  getSubdomain() {
    let hostname = window.location.hostname;
    return hostname.substring(hostname.indexOf(".") + 1);
  }
  globalConfigExists() {
    return typeof window.globalConfigs !== "undefined" && typeof window.globalConfigs.getConfig === "function";
  }
  componentWillUnmount() {
  clearInterval(this.countdownInterval);
  window.removeEventListener("message", this.onMessage, false);
  window.removeEventListener("loacaleChangeEvent", this.resetIframe, false);
  window.removeEventListener("refreshSession", this.fetchTTL);
  const iframe = document.getElementById("erp_iframe");
  if (iframe) iframe.removeEventListener("load", this.onFrameLoad);
}

}

export default connect(null, { setSessionTTL, logout })(EGFFinance);
