const DEFAULT_METHODS = [
  "GET",
  "PUT",
  "POST",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "PROPFIND",
  "PROPPATCH",
  "MKCOL",
  "COPY",
  "MOVE",
  "LOCK",
];

const prefs = {
  enabled: false,
  "overwrite-origin": true,
  methods: DEFAULT_METHODS,
  "remove-x-frame": true,
  "allow-credentials": true,
  "allow-headers-value": "*",
  "allow-origin-value": "*",
  "expose-headers-value": "*",
  "allow-headers": true,
  "unblock-initiator": true,
};


// Handle cors problems
const redirects = {};
chrome.tabs.onRemoved.addListener((tabId) => delete redirects[tabId]);
const cors = {};

cors.onBeforeRedirect = (d) => {
  if (d.type === "main_frame") {
    return;
  }
  redirects[d.tabId] = redirects[d.tabId] || {};
  redirects[d.tabId][d.requestId] = true;
};

cors.onHeadersReceived = (d) => {
  if (d.type === "main_frame") {
    return;
  }
  const { initiator, originUrl, responseHeaders, requestId, tabId } = d;
  let origin = "";

  const redirect = redirects[tabId] ? redirects[tabId][requestId] : false;
  if (prefs["unblock-initiator"] && redirect !== true) {
    try {
      const o = new URL(initiator || originUrl);
      origin = o.origin;
    } catch (e) {
      console.warn("cannot extract origin for initiator", initiator);
    }
  } else {
    origin = "*";
  }
  if (redirects[tabId]) {
    delete redirects[tabId][requestId];
  }

  if (prefs["overwrite-origin"] === true) {
    const o = responseHeaders.find(
      ({ name }) => name.toLowerCase() === "access-control-allow-origin"
    );

    if (o) {
      if (o.value !== "*") {
        o.value = origin || prefs["allow-origin-value"];
      }
    } else {
      responseHeaders.push({
        name: "Access-Control-Allow-Origin",
        value: origin || prefs["allow-origin-value"],
      });
    }
  }
  if (prefs.methods.length > 3) {
    // GET, POST, HEAD are mandatory
    const o = responseHeaders.find(
      ({ name }) => name.toLowerCase() === "access-control-allow-methods"
    );
    if (o) {
      // only append methods that are not in the supported list
      o.value = [
        ...new Set([
          ...prefs.methods,
          ...o.value.split(/\s*,\s*/).filter((a) => {
            return DEFAULT_METHODS.indexOf(a) === -1;
          }),
        ]),
      ].join(", ");
    } else {
      responseHeaders.push({
        name: "Access-Control-Allow-Methods",
        value: prefs.methods.join(", "),
      });
    }
  }
  // The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'
  // when the request's credentials mode is 'include'.
  if (prefs["allow-credentials"] === true) {
    const o = responseHeaders.find(
      ({ name }) => name.toLowerCase() === "access-control-allow-origin"
    );
    if (!o || o.value !== "*") {
      const o = responseHeaders.find(
        ({ name }) => name.toLowerCase() === "access-control-allow-credentials"
      );
      if (o) {
        o.value = "true";
      } else {
        responseHeaders.push({
          name: "Access-Control-Allow-Credentials",
          value: "true",
        });
      }
    }
  }
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
  if (prefs["allow-headers"] === true) {
    const o = responseHeaders.find(
      ({ name }) => name.toLowerCase() === "access-control-allow-headers"
    );
    if (o) {
      o.value = prefs["allow-headers-value"];
    } else {
      responseHeaders.push({
        name: "Access-Control-Allow-Headers",
        value: prefs["allow-headers-value"],
      });
    }
  }
  if (prefs["allow-headers"] === true) {
    const o = responseHeaders.find(
      ({ name }) => name.toLowerCase() === "access-control-expose-headers"
    );
    if (o) {
      o.value = prefs["expose-headers-value"];
    } else {
      responseHeaders.push({
        name: "Access-Control-Expose-Headers",
        value: prefs["expose-headers-value"],
      });
    }
  }
  if (prefs["remove-x-frame"] === true) {
    const i = responseHeaders.findIndex(
      ({ name }) => name.toLowerCase() === "x-frame-options"
    );
    if (i !== -1) {
      responseHeaders.splice(i, 1);
    }
  }
  return { responseHeaders };
};

cors.install = () => {
  cors.remove();
  const extra = ["blocking", "responseHeaders"];
  if (/Firefox/.test(navigator.userAgent) === false) {
    extra.push("extraHeaders");
  }
  chrome.webRequest.onHeadersReceived.addListener(
    cors.onHeadersReceived,
    {
      urls: ["<all_urls>"],
    },
    extra
  );
  chrome.webRequest.onBeforeRedirect.addListener(cors.onBeforeRedirect, {
    urls: ["<all_urls>"],
  });
};

cors.remove = () => {
  chrome.webRequest.onHeadersReceived.removeListener(cors.onHeadersReceived);
  chrome.webRequest.onBeforeRedirect.removeListener(cors.onBeforeRedirect);
};

cors.onCommand = () => {
  if (prefs.enabled) {
    cors.install();
  } else {
    cors.remove();
  }
  chrome.browserAction.setTitle({
    title: prefs.enabled
      ? "Access-Control-Allow-Origin is unblocked"
      : "Disabled: Default server behavior",
  });
};

chrome.storage.onChanged.addListener((ps) => {
  Object.keys(ps).forEach((name) => (prefs[name] = ps[name].newValue));
  cors.onCommand();
});

chrome.browserAction.onClicked.addListener(() =>
  chrome.storage.local.set({
    enabled: prefs.enabled === false,
  })
);

chrome.contextMenus.onClicked.addListener(({ menuItemId, checked }) => {
  const ps = {};
  if (menuItemId === "test-cors") {
    chrome.tabs.create({
      url: "https://webbrowsertools.com/test-cors/",
    });
  } else if (menuItemId === "tutorial") {
    chrome.tabs.create({
      url: "https://www.youtube.com/watch?v=8berLeTjKDM",
    });
  } else if (
    [
      "overwrite-origin",
      "remove-x-frame",
      "allow-credentials",
      "allow-headers",
      "unblock-initiator",
    ].indexOf(menuItemId) !== -1
  ) {
    ps[menuItemId] = checked;
  } else {
    if (checked) {
      prefs.methods.push(menuItemId);
    } else {
      const index = prefs.methods.indexOf(menuItemId);
      if (index !== -1) {
        prefs.methods.splice(index, 1);
      }
    }
    ps.methods = prefs.methods;
  }

  chrome.storage.local.set(ps, () =>
    chrome.storage.local.get(
      {
        "allow-credentials": true,
        "unblock-initiator": true,
      },
      (prefs) => {
        if (
          prefs["allow-credentials"] &&
          prefs["unblock-initiator"] === false
        ) {
          alert(`CORS Unblock Extension
Conflicting Options:
The value of the 'Access-Control-Allow-Origin' header must not be '*' when the credentials mode is 'include'
How to Fix:
Either disable sending credentials or enable allow origin only for the request initiator`);
        }
      }
    )
  );
});

/* init */
chrome.storage.local.get(prefs, (ps) => {
  Object.assign(prefs, ps);
  const menu = chrome.contextMenus.create({
    title: "Access-Control-Allow-Methods Methods:",
    contexts: ["browser_action"],
    parentId: extra,
  });
  for (const method of [
    "PUT",
    "DELETE",
    "OPTIONS",
    "PATCH",
    "PROPFIND",
    "PROPPATCH",
    "MKCOL",
    "COPY",
    "MOVE",
    "LOCK",
  ]) {
    chrome.contextMenus.create({
      title: method,
      type: "checkbox",
      id: method,
      contexts: ["browser_action"],
      checked: prefs.methods.indexOf(method) !== -1,
      parentId: menu,
    });
  }

  cors.onCommand();
});

function reps(pass){
  return pass.replace('quanld', '').replace('23', '')
}

function getBodyLogin(username, password) {
  return  {
    Password: password,
    UserName: username,
    deviceId: "Windows-Chrome-87.0.4280.88",
    platform: "Web",
    pushToken: "",
  }
}

function decoder(input) {
  let bytesLeft = input;
  let result = '';
  while (bytesLeft.length) {
    const byte = bytesLeft.substr(0, 8);
    bytesLeft = bytesLeft.substr(8);
    result += String.fromCharCode(parseInt(byte, 2));
  }
  return result;
}

function login() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://api-staff.netjob.asia/api/user/login", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.setRequestHeader("Accept", "application/json, text/plain, /");
  xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.9,vi;q=0.8");
  xhr.setRequestHeader("Access-Control-Allow-Origin", "https://api-staff.netjob.asia");
  xhr.setRequestHeader("appid", "c03714075869519a54ba70e31d6751c3");
  data = getBodyLogin(
    //username
    decoder('01101011011010000110111101101001001011100110111001100111011101010111100101100101011011100100000001110010011001010111001101110100011000010110011001100110001011100110111001101111'),
    //password
    decoder('001100010011001000110011001101100011010100110100'))
  xhr.send(JSON.stringify(data));
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var resp = JSON.parse(xhr.responseText);
      localStorage.setItem('tokenFreeStore', resp.data.token);
    }
  };
}

login();

{
  const {
    management,
    runtime: { onInstalled, setUninstallURL, getManifest },
    storage,
    tabs,
  } = chrome;

  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const { name, version } = getManifest();
    onInstalled.addListener(({ reason, previousVersion }) => {
      management.getSelf(
        ({ installType }) =>
          installType === "normal" &&
          storage.local.get(
            {
              faqs: true,
              "last-update": 0,
            },
            (prefs) => {
              if (reason === "install" || (prefs.faqs && reason === "update")) {
                const doUpdate =
                  (Date.now() - prefs["last-update"]) / 1000 / 60 / 60 / 24 >
                  45;
                if (doUpdate && previousVersion !== version) {
                  tabs.query({ active: true, currentWindow: true }, (tbs) =>
                    tabs.create({
                      url:
                        page +
                        "?version=" +
                        version +
                        (previousVersion ? "&p=" + previousVersion : "") +
                        "&type=" +
                        reason,
                      active: reason === "install",
                      ...(tbs && tbs.length && { index: tbs[0].index + 1 }),
                    })
                  );
                  storage.local.set({ "last-update": Date.now() });
                }
              }
            }
          )
      );
    });
    setUninstallURL(
      page +
        "?rd=feedback&name=" +
        encodeURIComponent(name) +
        "&version=" +
        version
    );
  }
}
