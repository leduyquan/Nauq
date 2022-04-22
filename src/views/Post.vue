<template>
  <div class="search">
    <div class="search-input">
      <a-input-search
        class="search-sidebar"
        :disabled="!post.length"
        :loading="!post.length"
        placeholder="Search for post"
        @change="onSearch"
      />
    </div>
    <div class="options">
      <div>Total: {{total}}</div>
      <div class="sort-order">
        <div style="line-height: 0px;">
          <a-popover v-if="!isRefreshPost">
            <template slot="content"> Refresh </template>
            <a-icon type="reload" class="fs-18" style="color: #F6F6F6" @click="onRefresh"/>
          </a-popover>
          <a-icon v-else class="fs-18" type="sync" spin style="color: #F6F6F6" />
        </div>
        <div class="sortby">
          <span>Sort by: </span>
          <a-select default-value="createdDate" style="width: 120px" @change="handleChange" >
            <a-select-option value="createdDate"> Created date </a-select-option>
            <a-select-option value="title"> Title </a-select-option>
            <a-select-option value="author"> Author </a-select-option>
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
        <a-collapse-panel v-for="(item, index) in postSearch" :key="index" >
          <template slot="header" >
            <div class="item-post" @click="onCollapse(item, index)">
              <div class="title">{{startCase(item.title)}}</div>
              <div class="info">
                <div class="author">Author: {{item.user ? item.user.fullName : 'unknown'}}</div>
                <div class="time">{{getPostdate(item.createdDate)}}</div>
              </div>
            </div>
          </template>
          <div class="d-flex justify-content-end p-right-20">
            <img v-if="item.contentHtml" style="height: 100px" v-lazy="domain + '/cdn/file/' + item.contentHtml" />
          </div>
          <div :id="'detailPost-' + index"></div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>
<script>
import _ from 'lodash'
import moment from 'moment'
export default {
  props: ["domain", "post", "isRefreshPost"],
  data() {
    return {
      isOrdered: true,
      sortBy: 'createdDate',
      postSearch: [],
      total: 0
    };
  },
  watch: {
    sortBy() {
      this.onSort()
    },
    isOrdered() {
      this.onSort()
    },
    post(val) {
      this.postSearch = val
      this.total = val.length
      this.onSort()
    }
  },
  mounted() {
    this.postSearch = this.post
    this.total = this.post.length
    this.onSort()
  },
  methods: {
    async onRefresh() {
      this.$emit('onRefresh')
    },
    onSearch: _.debounce(function(e) {
      const keyword = e.target.value
      if (keyword) {
        const text = keyword.toLowerCase();
        const checkInclude = (val) => val ? val.toLowerCase().includes(text) : false
        const getName = (user) => user ? user.fullName : 'unknown'
        this.postSearch = this.post.filter(item => checkInclude(item.title) || checkInclude(getName(item.user)));
      } else {
        this.postSearch = this.post
      }
      this.total = this.postSearch.length
      this.onSort();
    }, 200),
    startCase(text) {
      return _.startCase(_.capitalize(text))
    },
    onSort() {
      let order = 'asc'
      if (this.isOrdered) {
        if (this.sortBy === 'createdDate') { order = 'desc' } else { order = 'asc' }
      } else { if (this.sortBy === 'createdDate') { order = 'asc' } else { order = 'desc' } }
      this.postSearch = _.orderBy(this.postSearch, [this.sortBy], [order]);
    },
    handleChange(value) {
      this.sortBy = value
    },
    onCollapse(item, index) {
      setTimeout(() => {
        const el = document.getElementById('detailPost-' + index);
        el.innerHTML = item.description
      }, 100)
    },
    getPostdate(joindate) {
      const diff = this.dateDiff(joindate, moment());
      if (diff) {
        if (diff.years > 0) {
          return `${diff.years} year${diff.years === 1 ? '' : 's'} ago`
        } else if (diff.months > 0) {
          return `${diff.months} month${diff.months === 1 ? '' : 's'} ago`
        } else {
          return `${diff.days} day${diff.days === 1 ? '' : 's'} ago`
        }
      } else {
        return 'unknown'
      }
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
        return null;
      }
    }
  },
};
</script>
