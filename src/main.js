import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import mixin from './mixin'
import store from './store'
import 'ant-design-vue/dist/antd.css';

Vue.use(Antd)
Vue.config.productionTip = false

new Vue({
  store,
  mixin,
  render: h => h(App)
}).$mount('#app')
