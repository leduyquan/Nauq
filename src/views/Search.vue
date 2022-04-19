<template>
  <div class="search">
    <div class="search-input">
      <a-input-search
        class="search-sidebar"
        :disabled="!isLoadedUser"
        :loading="!isLoadedUser"
        placeholder="Search for users (no login required)"
        @change="onSearch"
      />
    </div>
    <div class="options">
      <div>Total: {{total}}</div>
      <div class="sort-order">
        <div style="line-height: 0px;">
          <a-popover v-if="!isRefreshSearch">
            <template slot="content"> Refresh </template>
            <a-icon type="reload" class="fs-18" style="color: #F6F6F6" @click="onRefresh"/>
          </a-popover>
          <a-icon v-else class="fs-18" type="sync" spin style="color: #F6F6F6" />
        </div>
        <div class="sortby">
          <span>Sort by: </span>
          <a-select default-value="joinedDate" style="width: 120px" @change="handleChange" >
            <a-select-option value="team"> Team </a-select-option>
            <a-select-option value="fullName"> Name </a-select-option>
            <a-select-option value="joinedDate"> Joined Date </a-select-option>
          </a-select>
        </div>
        <div class="order">
          <span>Order: </span>
          <a-checkbox :checked="isOrdered" @change="isOrdered =!isOrdered" />
        </div>
      </div>
    </div>
    <div class="list-info scrollbar">
      <a-collapse :bordered="true" expandIconPosition="right" accordion>
        <template #expandIcon="props">
          <a-icon type="caret-right" :rotate="props.isActive ? 90 : 0" />
        </template>
        <a-collapse-panel v-for="(item, index) in usersSearch" :key="index" >
          <template slot="header" >
            <div class="item" @click="onCollapse(item.employeeId)">
              <a-popover overlayClassName="popover-custom" placement="right">
                <template slot="content">
                  <img v-if="item.employeeId === getAdminId()" class="image-popover" :src="item.avatarUrl" />
                  <img v-else class="image-popover" :src="getAvatar(item.avatarUrl)" />
                </template>
                <img v-if="item.employeeId === getAdminId()" class="image" :src="item.avatarUrl" />
                <img v-else class="image" :src="getAvatar(item.avatarUrl)" />
              </a-popover>
              <div class="bio">
                <div class="m-left-25" style="width: 190px">
                  <div class="name">{{item.fullName}}</div>
                  <div class="position">{{item.position}}</div>
                </div>
                <div class="m-left-35">
                  <div class="team">{{item.team}}</div>
                  <div class="joineddate">{{item.diffDate}}</div>
                </div>
              </div>
            </div>
          </template>
          <div class="detail">
            <a class="link-logo" :href="'skype:' + detail.socialAccount + '?chat'">
              <div v-if="item.employeeId === getAdminId()" class="background-img">
                <div class="box">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <div class="content-img">
                    <img class="image" style="border: 1px solid #E5E4E2;" :src="item.avatarUrl" />
                  </div>
                </div>
              </div>
              <img v-else class="image" :src="getAvatar(item.avatarUrl)" />
              <img v-if="detail.socialAccount !== 'unknown'" class="logo-skype" src="../assets/img/icons/skype.png" />
            </a>
            <div class="m-left-15" style="width: 115px">
              <div class="birthday d-flex align-items-center m-bot-5">
                <a-popover>
                  <template slot="content"> Birthday </template>
                  <i class="icon-birthday m-right-5 fs-14"></i>
                </a-popover>
                <span class="fs-12">{{formatDate(detail.dateOfBirth)}}</span>
              </div>
              <div class="phone d-flex align-items-center m-bot-5">
                <a-popover>
                  <template slot="content"> Phone </template>
                  <i class="icon-phone m-right-5 fs-14"></i>
                </a-popover>
                <span class="fs-12">{{detail.phoneMobile}}</span>
              </div>
              <div class="joineddate d-flex align-items-center m-bot-5">
                <a-popover>
                  <template slot="content"> Joined date </template>
                  <i class="icon-join m-right-5 fs-14"></i>
                </a-popover>
                <span class="fs-12">{{formatDate(item.joinedDate)}}</span>
              </div>
            </div>
            <div class="m-left-30">
              <div class="email d-flex align-items-center m-bot-5">
                <a-popover>
                  <template slot="content"> Email </template>
                  <i class="icon-email m-right-5 fs-14"></i>
                </a-popover>
                <span class="fs-12">{{detail.email}}</span>
              </div>
              <div class="email-private d-flex align-items-center m-bot-5">
                <a-popover>
                  <template slot="content"> Email private </template>
                  <i class="icon-email-private m-right-5 fs-14"></i>
                </a-popover>
                <span class="fs-12">{{detail.privateEmail}}</span>
              </div>
              <div class="characteristics d-flex m-bot-5">
                <a-popover>
                  <template slot="content"> Characteristics </template>
                  <i class="icon-charac m-right-5 fs-14"></i>
                </a-popover>
                <div style="padding-top: 3px">
                  <span class="fs-12">{{item.character}}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="address d-flex fs-13" style="padding-left: 105px">
            <i class="icon-address m-right-5 fs-14" style="line-height: 16px" ></i ><span class="fs-12">{{detail.address}}</span>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import _ from 'lodash'
import moment from 'moment'
export default {
  props: ["domain", "tokenFreeStore"],
  data() {
    return {
      isOrdered: true,
      sortBy: 'joinedDate',
      users: [],
      detail: {
        address: 'unknown',
        dateOfBirth: 'unknown',
        phoneMobile: 'unknown',
        email: 'unknown',
        privateEmail: 'unknown',
        socialAccount: 'unknown',
        joinedDate: 'unknown'
      },
      total: 0,
      usersSearch: [],
      isLoadedUser: false,
      isRefreshSearch: false,
      headers: {}
    };
  },
  watch: {
    sortBy() {
      this.onSort()
    },
    isOrdered() {
      this.onSort()
    },
    tokenFreeStore(val) {
      if(val) {
        this.headers = this.getHeader(this.domain, val)
        this.getAllUsers()
      }
    }
  },
  mounted() {
    if(this.tokenFreeStore) {
      this.headers = this.getHeader(this.domain, this.tokenFreeStore)
      this.getAllUsers()
    }
  },
  methods: {
    onRefresh() {
      this.$emit('onRefresh')
    },
    async getAllUsers() {
      try {
        this.isRefreshSearch = true
        const responseChart = await axios.get(`${this.domain}/api/user/get-data-org-chart`, { headers: this.headers })
        const responseMember = await axios.get(`${this.domain}/api/department_group/get-members?keyWord=&pageNumber=1&pageSize=100&groupId=9adf08c4-7ea9-4a70-2c99-08d84e39a926`, { headers: this.headers })
        const memberData = responseMember.data.results
        const chartData = responseChart.data
        const listUserId = []
        const dataUnique = _.unionBy(chartData, 'name').filter(item => item.name !== 'House Of Norway')
        dataUnique.map(item => { item.children.map(child => listUserId.push({id: child.data.employeeId, name: child.name, team: child.data.groupName})) })
        const userIdUniq = _.uniqBy(listUserId, 'id')
        const chaka = ['Có khả năng bê đê cao', 'Sida nhưng thích xông pha', 'Ảo tưởng sâu và nặng', 'Ngoài vô dụng thì ko còn làm đc gì', 'Cần makeup lại nhân phẩm',
                          'Thích khoái lạc', 'Yêu tổ quốc', 'Âm binh đầu đinh thắt bím', 'Có dấu hiệu suy thoái đạo đức', 'Đã bị tha hóa nhân cách',
                          'Xấu lại còn thích đóng vai ác', 'Là 1 nhân viên tốt, nhưng sẽ tốt hơn khi ko còn là nhân viên', 'Thích chửi bậy', 'Không thiếu gì ngoài thiếu nợ']
        const userAll = memberData.map(member => {
          let team = 'unknown'
          userIdUniq.map(chart => { if (member.employeeId === chart.id) { team = chart.team } })
          if (member.employeeId === this.getAdminId()) {
            return {
              ...member,
              employeeId: this.getAdminId(),
              fullName: 'Lee Yi Woon',
              team: _.capitalize(team),
              position: 'Thanh lịch vô địch khắp vũ trụ',
              diffDate: 'hotstar',
              joinedDate: moment().format('YYYY-MM-DD'),
              avatarUrl: 'https://res.cloudinary.com/restaff/image/upload/v1624698347/avatar/avatar_pnwuki.jpg',
              character: 'Phong cách của anh ko bao giờ làm theo kế hoạch, thích thì cứ nhào dzô'
            }
          }
          return {
            ...member,
            team: _.capitalize(team),
            diffDate: this.getJoineddate(member.joinedDate),
            character: _.sample(chaka),
          }
        })
        this.isLoadedUser = true
        console.log('userDatas', userDatas)
        const userDatas = userAll.filter(item => !!item.employeeId)
        this.users = userDatas
        this.usersSearch = userDatas
        this.total = userDatas.length
        this.onSort()
      } catch (error) {
        console.log(error)
      } finally {
        setTimeout(() => {
          this.isRefreshSearch = false
        }, 500)
      }
    },
    async onCollapse(employeeId) {
      const response = await axios.get(`${this.domain}/api/employee/get_by_personal?id=${employeeId}`, { headers: this.headers })
      const data = _.pick(response.data, ['address', 'avatarUrl', 'dateOfBirth', 'email', 'phoneMobile', 'privateEmail', 'socialAccount', 'joinedDate'])
      if (employeeId === this.getAdminId()) {
        this.detail = {
          address: 'Asgard and 9 realms',
          dateOfBirth: 'soon',
          phoneMobile: 'unknown',
          email: 'quan.deptrai@restaff.no',
          privateEmail: 'deptraitube@gmail.com',
          socialAccount: data.socialAccount || 'unknown',
          joinedDate: data.joinedDate || 'unknown'
        }
      } else {
        this.detail = {
          address: data.address || 'unknown',
          dateOfBirth: data.dateOfBirth || 'unknown',
          phoneMobile: data.phoneMobile || 'unknown',
          email: data.email || 'unknown',
          privateEmail: data.privateEmail || 'unknown',
          socialAccount: data.socialAccount || 'unknown',
          joinedDate: data.joinedDate || 'unknown'
        }
      }
    },
    onSearch: _.debounce(function(e) {
      const keyword = e.target.value
      if (keyword) {
        const text = keyword.toLowerCase();
        const checkInclude = (val) => val ? val.toLowerCase().includes(text) : false
        this.usersSearch = this.users.filter(item => checkInclude(item.fullName) || checkInclude(item.team));
      } else {
        this.usersSearch = this.users
      }
      this.total = this.usersSearch.length
      this.onSort();
    }, 200),
    onSort() {
      let order = 'asc'
      if (this.isOrdered) {
        if (this.sortBy === 'joinedDate') { order = 'desc' } else { order = 'asc' }
      } else { if (this.sortBy === 'joinedDate') { order = 'asc' } else { order = 'desc' } }
      this.usersSearch = _.orderBy(this.usersSearch, [this.sortBy], [order]);
    },
    handleChange(value) {
      this.sortBy = value
    },
    getJoineddate(joindate) {
      const diff = this.dateDiff(joindate, moment());
      return `${diff.years} years & ${diff.months} months`
    },
    getAvatar(value) {
      return value && (value !== 'd_lNMdXHZsaSu6umWdi3tgTDzcBJ5QRzHnuddk_74aQDS9GAzRzG8GA9irY0gMijJlLJcGL5IY-Xdt8ABj9tSxN6mwYg5o_jDN9GTqDUD1jwus5PGxmzQjJw0Dgpc2AOu_yJLlN3N4YFuSozo8c9-g')
        ? `${this.domain}/cdn/file/${value}` : 'https://www.kindpng.com/picc/m/78-785827_user-profile-avatar-login-account-male-user-icon.png'
    },
    formatDate(date) {
      if (date === 'soon') return 'soon'
      return moment(date).format('DD/MM/YYYY')
    },
    dateDiff(startdate, enddate) {
      var startdateMoment = moment(startdate);
      var enddateMoment = moment(enddate);
      if (startdateMoment.isValid() === true && enddateMoment.isValid() === true) {
        var years = enddateMoment.diff(startdateMoment, 'years');
        var months = enddateMoment.diff(startdateMoment, 'months') - (years * 12);
        startdateMoment.add(years, 'years').add(months, 'months');
        var days = enddateMoment.diff(startdateMoment, 'days')
        return { years: years, months: months, days: days };
      }
      else {
        return { years: 'NaN', months: 'NaN', days: 'NaN' };
      }
    },
  },
};
</script>
