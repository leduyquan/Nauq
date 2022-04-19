<template>
  <div class="tools">
    <div v-if="!tokenUserStore" class="need-login">* You need to login first</div>
    <div :class="tokenUserStore ? '' : 'not-allowed'">
      <div class="claim">
        <div class="d-flex align-items-center fw-bold" style="padding-bottom: 4px">
          <div style="width: 165px">Claim daily: {{claimPoint}} points</div>
          <a-popover v-if="claimTier">
            <template slot="content">
              <div class="fw-bold fs-12">{{claimTier === 'New' ? 'Bronze' : claimTier}}</div>
              <img width="100" :src="'../assets/img/rank/' + claimTier + '.png'">
            </template>
            <img height="25" :src="'../assets/img/rank/' + claimTier + '.png'">
          </a-popover>
        </div>
        <div class="tools-item">
          <div class="d-flex justify-content-between">
            <div class="claim-status">
              <a-popover>
                <template slot="content"> Claim status </template>
                <i class="icon-claim m-right-5 fs-14"></i>
              </a-popover>
              <a-select v-model="claimStatusSelected" style="width: 105px">
                <a-select-option v-for="(item, index) in claimStatus" :key="index" :value="item.value" >
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="timer">
              <a-popover>
                <template slot="content"> Timer </template>
                <i class="icon-timer m-right-5 fs-14"></i>
              </a-popover>
              <a-select disabled v-model="claimTimer" style="width: 105px">
                <a-select-option v-for="(item, index) in timer" :key="index" :value="item.value" >
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </div>
            <div>
              <a-button v-if="!claimRun" type="primary" @click="runClaim"> Run </a-button>
              <a-button v-else type="danger" @click="stopClaim"> Stop </a-button>
            </div>
          </div>
          <div class="note">Note: {{claimNote}}</div>
        </div>
      </div>
      <div class="like m-top-20">
        <div class="fw-bold" style="padding-bottom: 4px">Like all posts: {{totalPost}} posts total</div>
        <div class="tools-item">
          <div class="d-flex justify-content-between">
            <div class="timer">
              <a-popover>
                <template slot="content"> Timer </template>
                <i class="icon-timer m-right-5 fs-14"></i>
              </a-popover>
              <a-select disabled v-model="likeTimer" style="width: 105px">
                <a-select-option v-for="(item, index) in timer" :key="index" :value="item.value" >
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </div>
            <div>
              <a-button v-if="!likeRun" type="primary" @click="runLike"> Run </a-button>
              <a-button v-else type="danger" @click="stopLike"> Stop </a-button>
            </div>
          </div>
          <div class="note">Note: {{likeNote}}</div>
        </div>
      </div>
      <div class="birthday m-top-20">
        <div class="fw-bold d-flex" style="padding-bottom: 4px">
          <div class="birthday-title">Happy birthday: {{birthdayDatas.length}} people today</div>
          <a-popover>
            <template slot="content">
              <div class="d-flex align-items-center gap-10 m-bot-5" v-for="(item, index) in birthdayDatas" :key="index">
                <img style="width: 30px; border-radius: 50%" :src="domain + '/cdn/file/' + item.avatarUrl" />
                <span>{{item.fullName}}</span>
              </div>
            </template>
            <i class="icon-people-list m-right-5 fs-14"></i>
          </a-popover>
        </div>
        <div class="tools-item">
          <div class="d-flex justify-content-between">
            <div class="timer">
              <a-popover>
                <template slot="content"> Timer </template>
                <i class="icon-timer m-right-5 fs-14"></i>
              </a-popover>
              <a-select disabled v-model="birthdayTimer" style="width: 105px">
                <a-select-option v-for="(item, index) in timer" :key="index" :value="item.value" >
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </div>
            <div>
              <a-button v-if="!birthdayRun" type="primary" @click="runBirthday"> Run </a-button>
              <a-button v-else type="danger" @click="stopBirthday"> Stop </a-button>
            </div>
          </div>
          <div class="note">Note: {{birthdayNote}}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import _ from "lodash";
import moment from 'moment'
import { mapState, mapActions } from 'vuex'
export default {
  props: ["domain", "tokenUserStore", 'bus'],
  data() {
    return {
      claimStatus: [
        { name: "Lovely", value: "1" },
        { name: "Happy", value: "2" },
        { name: "Normal", value: "3" },
        { name: "Unhappy", value: "4" },
        { name: "Sad", value: "5" },
      ],
      claimStatusSelected: "1",
      timer: [
        { name: "4 hours", value: 14400000 },
        { name: "6 hours", value: 21600000 },
        { name: "12 hours", value: 43200000 },
        { name: "1 day", value: 86400000 },
      ],
      claimPoint: 0,
      claimTier: '',
      claimTimer: 86400000,
      claimTimerInterval: '',
      claimRun: false,
      claimNote: "Haven't got points today",

      postDatas: [],
      postNotLiked: [],
      postNotLikedTotal: 0,
      totalPost: 0,
      likeTimer: 86400000,
      likeTimerInterval: '',
      likeRun: false,
      likeNote: 'No new posts',

      birthdayDatas: [],
      birthdayTimer: 86400000,
      birthdayTimerInterval: '',
      birthdayRun: false,
      birthdayNote: 'No new birthdays',

      headers: {},
      params4Store: {}
    };
  },
  mounted() {
    if (this.tokenUserStore) {
      this.headers = this.getHeader(this.domain, this.tokenUserStore)
      this.params4Store = { domain: this.domain, headers: this.getHeader(this.domain, this.tokenUserStore) }
      this.init()
    }
    this.bus.$on('executeTools', this.executeTools)
  },
  watch: {
    tokenUserStore(val) {
      if (val) {
        this.headers = this.getHeader(this.domain, val)
        this.params4Store = { domain: this.domain, headers: this.getHeader(this.domain, this.tokenUserStore) }
        this.init()
      }
    },
    claimData: {
      deep: true,
      handler(data) {
        this.claimPoint = data.point
        this.claimTier = data.tier.description
        if (data.isClaimDaily) {
          this.claimNote = "Haven't got points today"
        } else {
          const sts = this.claimStatus.find(x => x.value === this.claimStatusSelected)
          this.claimNote = `You're ${sts.name.toLowerCase()} today`

        }
      }
    },
    postData: {
      deep: true,
      handler(data) {
        this.postDatas = data
        this.postNotLiked = data.filter(p => p.reactions.length === 0);
        this.postNotLikedTotal = this.postNotLiked.length
        this.totalPost = data.length
        this.likeNote = this.postNotLikedTotal > 0 ? `${this.postNotLikedTotal} posts haven't been liked` : 'No new posts'
      }
    },
    birthdayData: {
      deep: true,
      handler(data) {
        this.birthdayDatas = data
        this.birthdayNote = this.birthdayDatas.length > 0 ? '' : 'No new birthdays'
      }
    }
  },
  computed: {
    ...mapState(['claimData', 'postData', 'birthdayData'])
  },
  methods: {
    ...mapActions([ 'getClaimData', 'getPostData', 'getBirthdayData' ]),
    init() {
      this.getClaimData(this.params4Store)
      this.getPostData(this.params4Store)
      this.getBirthdayData(this.params4Store)
    },
    // Claim
    runClaim() {
      clearInterval(this.claimTimerInterval);
      this.claimAction()
      this.claimTimerInterval = setInterval(() => { this.claimAction() }, this.claimTimer);
    },
    stopClaim() {
      clearInterval(this.claimTimerInterval);
      this.claimRun = false
      this.claimNote = ''
    },
    async claimAction() {
      const response = await axios.post(`${this.domain}/api/user/claim-daily`, this.claimStatusSelected, { headers: this.headers })
      const data = response
      if (data.status === 200) {
        const sts = this.claimStatus.find(x => x.value === this.claimStatusSelected)
        this.claimRun = true
        this.claimNote = `You're ${sts.name} today`
        this.getClaimData(this.params4Store)
      } else {
        this.claimNote = 'Something wrong!';
        this.claimRun = false
      }
    },

    // Like
    runLike() {
      clearInterval(this.likeTimerInterval);
      this.autoLike()
      this.likeTimerInterval = setInterval(() => {
        this.autoLike()
      }, this.likeTimer);
    },
    stopLike() {
      clearInterval(this.likeTimerInterval);
      this.likeRun = false
      this.likeNote = 'No new posts'
    },
    autoLike() {
      try {
        this.likeRun = true
        if (this.postNotLiked.length > 0) {
            this.postNotLiked.map(item => this.likeAction(item.id))
            this.likeNote = 'Bão like successfully'
            setTimeout(() => {
              this.getPostData(this.params4Store)
            }, 1200)
        } else {
          this.likeNote = 'No new posts'
        }
      } catch (error) {
        this.likeRun = false
        this.likeNote = 'Something wrong'
      }
    },
    async likeAction(postLatestId) {
      const body = {"newsFeedId":postLatestId}
      await axios.post(`${this.domain}/api/reactions/react-feed`, body, { headers: this.headers });
    },

    // Birthday
    runBirthday() {
      clearInterval(this.birthdayTimerInterval);
      this.autoBirthday()
      this.birthdayTimerInterval = setInterval(() => { this.autoBirthday() }, this.birthdayTimer);
    },
    stopBirthday() {
      clearInterval(this.birthdayTimerInterval);
      this.birthdayRun = false
      this.birthdayNote = 'No new birthdays'
    },
    autoBirthday() {
      try {
        this.birthdayRun = true
        if (this.birthdayDatas.length > 0) {
            this.birthdayDatas.map(item => this.birthdayAction(item))
            this.birthdayNote = 'Bão happy birthday successfully'
            setTimeout(() => {
              this.getBirthdayData(this.params4Store)
            }, 1200)
        } else {
          this.birthdayNote = 'No new posts'
        }
      } catch (error) {
        this.birthdayRun = false
        this.birthdayNote = 'Something wrong'
      }
    },
    async birthdayAction(body) {
      const bodyRequest = {
          allowComment: true,
          allowLike: true,
          beginDate: moment().format('YYYY-MM-DD'),
          description: body.fullName,
          isShow: false,
          newsFeedTypeId: 2,
          publicityLevel: 1,
          targetUserId: body.userId,
          title: "Happy birthday"
      }
      const response = await axios.post(`${this.domain}/api/wall/send-celebrate-birthday`, bodyRequest, { headers: this.headers })
    },
    executeTools() {
      this.runClaim()
      this.runLike()
      this.runBirthday()
    },
  },
};
</script>
