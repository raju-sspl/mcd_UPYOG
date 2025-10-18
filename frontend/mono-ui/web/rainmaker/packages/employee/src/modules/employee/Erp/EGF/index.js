import React, { Component } from "react";
import { getTenantId, getAccessToken } from "egov-ui-kit/utils/localStorageUtils";
import { setSessionTTL } from "egov-ui-kit/redux/app/actions";
import { connect } from "react-redux";
class EGFFinance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ttl: null,
      warningShown: false
    };
    this.onFrameLoad = this.onFrameLoad.bind(this);
    this.resetIframe = this.resetIframe.bind(this);
    this.fetchTTL = this.fetchTTL.bind(this);
  }
  onFrameLoad() {
    document.getElementById("erp_iframe").style.display = "block";
    this.fetchTTL();
  }

  startCountdown(ttlSeconds) {
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      ttlSeconds -= 1;
      if (ttlSeconds <= 0) {
        clearInterval(this.countdownInterval);
        ttlSeconds = 0;
      }
      this.props.setSessionTTL(ttlSeconds);
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
  }
}


  render() {
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

    return (
      <div>
        <iframe name="erp_iframe" id="erp_iframe" height={winheight} width="100%" />
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
    window.addEventListener("refreshSession", () => {
      console.log("refreshSession triggered!");
      this.fetchTTL();
    });
    document.getElementById("erp_iframe").addEventListener("load", this.onFrameLoad);
  }
  componentDidUpdate() {
    let isSecure = window.location.protocol === "https";
    let localeCookie = "locale=" + localStorage.getItem("locale") + ";path=/;domain=." + this.getSubdomain();
    if (isSecure) {
      localeCookie += ";secure";
    }
    window.document.cookie = localeCookie;
    document.forms["erp_form"].submit();
  }
  onMessage = (event) => {
    if (event.data != "close") return;
    // document.getElementById('erp_iframe').style.display='none';
    this.props.history.push("/inbox");
  };
  resetIframe() {
    this.forceUpdate();
  }
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

export default connect(null, { setSessionTTL })(EGFFinance);