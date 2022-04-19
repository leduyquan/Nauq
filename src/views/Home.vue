<template>
  <div class="container">
    <div class="home">
      <div class="login">
        <div class="form-login">
          <a-form layout="inline" :form="form" @submit="handleSubmit">
            <a-form-item :validate-status="userNameError() ? 'error' : ''" :help="userNameError() || ''" >
              <a-input v-decorator="['userName', { rules: [{ required: true }] }]" placeholder="Username" >
                <a-icon slot="prefix" type="user" style="color:rgba(0,0,0,.25)" />
              </a-input>
            </a-form-item>
            <a-form-item :validate-status="passwordError() ? 'error' : ''" :help="passwordError() || ''" >
              <a-input v-decorator="['password', { rules: [{ required: true }] }]" type="password" placeholder="Password" >
                <a-icon slot="prefix" type="lock" style="color:rgba(0,0,0,.25)" />
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-popover v-if="tokenUserStore && hasErrors(form.getFieldsError())">
                <template slot="content">
                  <div>Execute all of the functions in the Tools</div>
                </template>
                <a-button type="primary" @click="executeTools">
                  Auto Tool
                </a-button>
              </a-popover>
              <a-button v-else type="primary" html-type="submit" :disabled="hasErrors(form.getFieldsError())" >
                Log in
              </a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="status">
          <a-icon v-if="loginStatus === 'sync'" class="fs-25" type="sync" spin style="color: #0D8BDF" />
          <a-icon v-else-if="loginStatus === 'smile'" class="fs-25" type="smile" theme="twoTone" two-tone-color="#52c41a" />
          <a-icon v-else class="fs-25" type="frown" theme="twoTone" two-tone-color="#eb2f96" />
        </div>
      </div>
      <div class="content">
        <a-tabs default-active-key="search">
          <a-tab-pane key="search">
            <span slot="tab">
              <a-icon type="search" />
              Search
            </span>
            <Search :domain="domain" :token-free-store="tokenFreeStore" @onRefresh="login"></Search>
          </a-tab-pane>
          <a-tab-pane key="post">
            <span slot="tab">
              <a-icon type="profile" />
              News Feed
            </span>
            <Post :domain="domain" :post="post" :is-refresh-post="isRefreshPost" @onRefresh="login"></Post>
          </a-tab-pane>
          <a-tab-pane key="tools">
            <span slot="tab">
              <a-icon type="control" />
              Tools
            </span>
            <Tools :bus="bus" :domain="domain" :token-user-store="tokenUserStore"></Tools>
          </a-tab-pane>
        </a-tabs>
      </div>
      <Tools v-show="false" :bus="bus" :domain="domain" :token-user-store="tokenUserStore"></Tools>
    </div>
  </div>
</template>
<script>
function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some((field) => fieldsError[field]);
}
import Search from "./Search.vue";
import Tools from "./Tools.vue";
import Post from "./Post.vue";
import axios from "axios";
import Vue from 'vue'
import { mapActions } from 'vuex'
export default {
  components: {
    Search,
    Tools,
    Post
  },
  data() {
    return {
      hasErrors,
      loginStatus: "frown",
      form: this.$form.createForm(this, { name: "horizontal_login" }),
      domain: "https://api-staff.netjob.asia",
      post: [],
      isRefreshPost: false,
      tokenFreeStore: '',
      tokenUserStore: '',
      bus: new Vue(),
    };
  },
  watch: {
    loginStatus: {
      immediate: true,
      handler(val) { this.activeIcon(val === 'smile') }
    }
  },
  mounted() {
    this.tokenFreeStore = this.getStorage('tokenFreeStore')
    this.tokenUserStore = this.getStorage('tokenUserStore')
    if (this.tokenFreeStore) {
      this.getPosts()
    } else {
      this.login();
    }
    if (this.tokenUserStore) {
      const params = { domain: this.domain, headers: this.getHeader(this.domain, this.tokenUserStore) }
      this.getClaimData(params)
      this.getPostData(params)
      this.getBirthdayData(params)
      this.loginStatus = 'smile'
    }
    this.$nextTick(() => { this.form.validateFields(); });
  },
  methods: {
    ...mapActions([ 'getClaimData', 'getPostData', 'getBirthdayData' ]),
    async login() {
      this.isRefreshPost = true
      const browser = browser || chrome
      const page = browser.extension.getBackgroundPage();
      page.login()
      setTimeout(() => {
        this.tokenFreeStore = this.getStorage('tokenFreeStore')
        this.getPosts()
      }, 500)
    },
    async getPosts() {
      this.isRefreshPost = true
      const headers = this.getHeader(this.domain, this.tokenFreeStore)
      const response = await axios.get(`${this.domain}/api/wall/get-user-wall?keyWord=&pageNumber=1&pageSize=100&noLoading=true&includeComment=true&includeReaction=true&includeUser=true`, { headers })
      const data = response.data
      this.post = data.map(item => ({
        ...item,
        author: item.user ?  item.user.fullName : 'unknown',
        title: this.startCase(item.title)
      }))
      this.isRefreshPost = false
    },
    startCase(text) {
      return _.startCase(_.capitalize(text))
    },
    userNameError() {
      const { getFieldError, isFieldTouched } = this.form;
      return isFieldTouched("userName") && getFieldError("userName");
    },
    passwordError() {
      const { getFieldError, isFieldTouched } = this.form;
      return isFieldTouched("password") && getFieldError("password");
    },
    handleSubmit(e) {
      const self = this;
      e.preventDefault();
      this.form.validateFields(async (err, values) => {
        if (!err) {
          try {
            self.loginStatus = "sync";
            const headers = self.getHeaderLogin(this.domain)
            const body = self.getBodyLogin(values.userName, values.password)
            const response = await axios.post(`${this.domain}/api/user/login`, body, { headers });
            const {data} = response.data;
            setTimeout(() => {
              if (data) {
                self.tokenUserStore = data.token
                self.loginStatus = "smile";
                self.setStorage('tokenUserStore', data.token)
              } else {
                self.tokenUserStore = ''
                self.loginStatus = "frown";
                self.setStorage('tokenUserStore', '')
              }
            }, 500)
          } catch (error) {
            self.loginStatus = "frown";
          }
        }
      });
    },
    activeIcon(isSmile) {
      chrome.browserAction.setIcon({
        path: {
          '16': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '16.png',
          '19': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '19.png',
          '32': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '32.png',
          '38': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '38.png',
          '48': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '48.png',
          '64': 'assets/img/icons/' + (isSmile? '' : 'disabled/') + '64.png'
        }
      });
    },
    executeTools() {
      this.loginStatus = "sync";
      this.bus.$emit('executeTools')
      setTimeout(() => {
        this.loginStatus = "smile";
      }, 300)
    }
  },
};
</script>
