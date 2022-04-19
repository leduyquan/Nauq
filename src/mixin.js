import Vue from 'vue';
export default Vue.mixin({
  methods: {
    getAdminId() {
      return 'a99c4adb-c9c9-4857-b390-c4d70d708bef'
    },
    getHeader(domain, token) {
      return {
        Accept: "application/json, text/plain, /",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Access-Control-Allow-Origin": `${domain}`,
        appid: "c03714075869519a54ba70e31d6751c3",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        timezone: "Asia/Bangkok",
      };
    },
    getHeaderLogin(domain) {
      return {
        Accept: "application/json, text/plain, /",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Access-Control-Allow-Origin": `${domain}`,
        appid: "c03714075869519a54ba70e31d6751c3",
        "Content-Type": "application/json",
        timezone: "Asia/Bangkok",
      }
    },
    getBodyLogin(username, password) {
      return  {
        Password: password,
        UserName: username,
        deviceId: "Windows-Chrome-87.0.4280.88",
        platform: "Web",
        pushToken: "",
      }
    },
    setStorage(key, value) {
      localStorage.setItem([key], value);
    },
    getStorage(key) {
      return localStorage.getItem(key);
    }
  },
});