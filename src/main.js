import Vue from 'vue'
import Antd from 'ant-design-vue';
import VueLazyload from 'vue-lazyload'
import App from './App.vue'
import mixin from './mixin'
import store from './store'
import 'ant-design-vue/dist/antd.css';

const loadimage = require('./assets/img/loading.gif')
const errorimage = require('./assets/img/icons/16.png')

Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: errorimage,
  loading: loadimage,
  attempt: 1
})

Vue.use(Antd)
Vue.config.productionTip = false

new Vue({
  store,
  mixin,
  render: h => h(App)
}).$mount('#app')
