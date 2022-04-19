import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

const state = {
    claimData: null,
    postData: [],
    birthdayData: []
}

const mutations = {
    getClaimData(state, data) {
        state.claimData = data;
    },
    getPostData(state, data) {
        state.postData = data;
    },
    getPostData(state, data) {
        state.postData = data;
    },
    getBirthdayData(state, data) {
        state.birthdayData = data;
    },
};

const actions = {
    getClaimData({ commit }, params) {
        axios.get(`${params.domain}/api/user/check-claim-daily`, { headers: params.headers })
        .then(response => {
            commit('getClaimData', response.data);
        })
        .catch(error => {
        })
    },
    getPostData({ commit }, params) {
      axios.get(`${params.domain}/api/wall/get-user-wall?keyWord=&pageNumber=1&pageSize=100&noLoading=true&includeComment=true&includeReaction=true&includeUser=true`, { headers: params.headers })
        .then(response => {
            commit('getPostData', response.data);
        })
        .catch(error => {
        })
    },
    getBirthdayData({ commit }, params) {
      axios.get(`${params.domain}/api/employee/get-birthday?noLoading=true`, { headers: params.headers })
        .then(response => {
            commit('getBirthdayData', response.data);
        })
        .catch(error => {
        })
    },
};

const getters = {
    claimData: state => state.claimData,
    postData: state => state.postData,
    birthdayData: state => state.birthdayData,
};

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters
});