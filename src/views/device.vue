
<template>
  <div class="index">
    <Row>
      <Col span="8">
      <div align="center">
        <Button type="primary"
                @click="refresh">刷新</Button>
        <Button type="primary"
                @click="changeMode">{{mode}}</Button>
      </div>
      </Col>
      <Col span="8">

      </Col>
      <Col span="8">

      </Col>
    </Row>
    <Row>
      <Col span="8">
      <div align="center"
           @mouseenter="showSlector = false">
        <div class="canvas_img">
          <canvas id="canvas1"
                  @mousemove="getImageCurrentXY"
                  @click="clickImage">
          </canvas>
        </div>
        <div v-show="showSlector"
             class="img_selector"
             v-bind:style="slectorClass">
        </div>
        <div v-show="showCheck">
          <div class="itemclass"
               :style="divItemStyle(item)"
               @mouseenter="pick"
               @mouseout="leave"
               @click="showNodeAttributes2(item)"
               v-for="(item,index) in divsData "
               :key="index"></div>

        </div>
      </div>
      </Col>
      <Col span="8">
      <div>
        <div id="tree">
          <Tree :data="dom_tree_data"
                :render="treeRenderContent"></Tree>
        </div>
        <div v-show="showLoading"
             class="demo-spin-container">
          <Spin fix></Spin>
        </div>
      </div>
      </Col>
      <Col span="8">
      <div id="nodeInfo">
        <div v-for="(value, key, index) in nodeInfo"
             :key="index">
          {{ key }} - {{ value }}
        </div>
        <div>
          定位器
        </div>
        <div>
          <div v-show="bys.id">id : {{bys.id}}</div>
          <div v-show="bys.text">text : {{bys.text}}</div>
          <div v-show="bys.AccessibilityId">AccessibilityId : {{bys.AccessibilityId}}</div>
          <div v-show="bys.xpath">xpath : {{bys.xpath}}</div>
          <div v-show="bys.location">location : {{bys.location}}</div>
        </div>
        <div>
          <Button type="primary"
                  v-show="nodeInfo['bounds']"
                  @click="getSubImage(nodeInfo['bounds'])">截图</Button>
        </div>
      </div>
      </Col>
    </Row>
  </div>
</template>
<script>
export default {
  data () {
    return {
      mode: '点击模式',
      startUiaotumatorSuccess: false,
      canvas: null,
      dom_tree_data: [],
      nodeInfo: {},
      showSlector: false,
      slectorClass: null,
      showLoading: false,
      image_x: 0,
      image_y: 0,
      image_x_ratio: 2,
      image_y_ratio: 2,
      enableClick: false,
      divsData: [],
      showCheck: false,
      bys: {}
    }
  },
  computed: {
    divItemStyle (value) {
      return function (value) {
        var rect = {
          left: this.canvas.offsetLeft + value.rect.left / this.image_x_ratio + 'px',
          top: this.canvas.offsetTop + value.rect.top / this.image_y_ratio + 'px',
          width: value.rect.width / this.image_x_ratio + 'px',
          height: value.rect.height / this.image_y_ratio + 'px',
          zIndex: value.zIndex
        }
        return rect
      }
    }
  },
  methods: {
    changeMode () {
      this.showCheck = !this.showCheck
      if (this.mode === '点击模式') {
        this.mode = '检索模式'
      } else {
        this.mode = '点击模式'
      }
    },
    dump () {
      this.showLoading = true
      this.$axios.get('/api/uiautomator/dump')
        .then(res => {
          if (res.data) {
            this.dom_tree_data = res.data.dom
            this.divsData = res.data.div
            this.showLoading = false
            this.getImage()
          }
        })
    },
    getImage () {
      this.showSlector = false
      var g = this.canvas.getContext('2d')
      var BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
      var img = new Image()
      img.onload = () => {
        this.canvas.width = 360
        this.canvas.height = 640
        this.image_x_ratio = img.width / this.canvas.width
        this.image_y_ratio = img.height / this.canvas.height
        g.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)
        img.onload = null
        img.src = BLANK_IMG
        img = null
      }
      img.src = '/api/uiautomator/doScreenshot?timestamp=' + (new Date()).getTime()
    },
    refresh () {
      this.dump()
      this.enableClick = true
    },
    clickImage () {
      if (this.enableClick === false) {
        return
      }
      if (this.image_x === 0 || this.image_y === 0) {
        return
      }
      if (this.canvas) {
        this.enableClick = false
        var x = this.image_x / this.canvas.width
        var y = this.image_y / this.canvas.height
        this.$axios.get('/api/uiautomator/click?x=' + x + '&y=' + y)
          .then(res => {
            if (res.data === true) {
              this.dump()
              this.enableClick = true
            }
          })
      }

    },
    showNodeInImage (data) {
      var bounds = data.attributes.bounds
      if (bounds) {
        var left = this.canvas.offsetLeft
        var top = this.canvas.offsetTop
        bounds = bounds.split("][");
        var bounds1 = bounds[0].split(",")
        var x1 = bounds1[0].substr(1, bounds1[0].length) / this.image_x_ratio
        var y1 = bounds1[1] / this.image_y_ratio
        var bounds2 = bounds[1].split(",")
        var x2 = bounds2[0] / this.image_x_ratio
        var y2 = bounds2[1].substr(0, bounds2[1].length - 1) / this.image_y_ratio
        left = left + x1
        top = top + y1
        var width = x2 - x1
        var height = y2 - y1
        this.slectorClass = {
          left: left + 'px',
          top: top + 'px',
          width: width + 'px',
          height: height + 'px'
        }
        this.showSlector = true
      }
    },
    showNodeAttributes (data) {
      var attributes = data.attributes
      this.nodeInfo = attributes
      this.nodeInfo['id'] = data.id
      this.nodeInfo['pId'] = data.pId
      this.bys = {}
      if (attributes['resource-id'] || attributes['text'] || attributes['content-desc']) {
        this.bys.id = attributes['resource-id']
        this.bys.text = attributes['text']
        this.bys.AccessibilityId = attributes['content-desc']
      } else {
        //var className = 'className("' + attributes.class + '")'
        //this.bys.uiautomator = this.buildUiautomation(data, className)
        if (data.id !== 1) {
          var className = attributes.class
          this.bys.xpath = this.buildXpath(data, className)
        }
      }
      this.bys.location = this.buildLocation(data)
    },
    buildXpath (node, value) {
      var pNode = this.searchTreeById(this.dom_tree_data, node.pId)
      var pAttributes = pNode.attributes
      if (pAttributes['text']) {
        value = '//' + pAttributes['class'] + '[@text=\'' + pAttributes['text'] + '\']/' + value
        //value = 'text("' + pAttributes['text'] + '").childSelector(' + value + ')'
      } else if (pAttributes['resource-id']) {
        value = '//' + pAttributes['class'] + '[@resource-id=\'' + pAttributes['resource-id'] + '\']/' + value
        //value = 'resourceId("' + pAttributes['resource-id'] + '").childSelector(' + value + ')'
      } else {
        value = '//' + value
      }
      return value
    },
    buildLocation (node) {
      var root = this.searchTreeById(this.dom_tree_data, 1)
      var width = root.attributes.width
      var height = root.attributes.height
      var str = '[' + width + ',' + height + ']' + (node.attributes.bounds ? node.attributes.bounds : '[0,0]' + '[' + width + ',' + height + ']')
      return str
    },
    getImageCurrentXY (event) {
      this.image_x = event.offsetX
      this.image_y = event.offsetY
    },
    treeRenderContent (h, { root, node, data }) {
      return h('span', {
        style: {
          display: 'inline-block',
          width: '100%'
        }
      }, [
          h('span', [
            h('span', {
              style: {
                cursor: 'pointer'
              },
              on: {
                mousemove: () => { this.showNodeInImage(data) },
                click: () => { this.showNodeAttributes(data) }
              }
            }, data.title)
          ])
        ]);
    },
    showNodeAttributes2 (data) {
      var node = this.searchTreeById(this.dom_tree_data, data.id)
      this.showNodeAttributes(node)
    },
    searchTreeById (treeArray, targetId) {
      var node = null
      var tree = treeArray
      for (var i = 0; i < tree.length; i++) {
        var id = tree[i].id
        if (id === targetId) {
          node = tree[i]
          break
        } else {
          if (tree[i].children) {
            node = this.searchTreeById(tree[i].children, targetId)
            if (node) {
              break
            }
          }
        }
      }
      return node
    },
    pick (event) {
      event.target.style.opacity = 0.4
    },
    leave (event) {
      event.target.style.opacity = 0
    },
    getSubImage (bounds) {
      bounds = bounds.split("][");
      var bounds1 = bounds[0].split(",")
      var x1 = bounds1[0].substr(1, bounds1[0].length)
      var y1 = bounds1[1]
      var bounds2 = bounds[1].split(",")
      var x2 = bounds2[0]
      var y2 = bounds2[1].substr(0, bounds2[1].length - 1)
      var w = x2 - x1
      var h = y2 - y1
      window.location.href = '/api/uiautomator/getSubimage?x=' + x1 + '&y=' + y1 + '&w=' + w + '&h=' + h + '&imageName=screenshot.png'
    }

  },
  async mounted () {
    this.canvas = document.getElementById('canvas1')
    this.$axios.get('/api/uiautomator/start')
      .then(res => {
        if ("success" === res.data) {
          this.startUiaotumatorSuccess = true
        } else {
          this.startUiaotumatorSuccess = false
        }
      })
  }
}
</script>
<style>
#tree {
  max-height: 640px;
  overflow: auto;
  position: relative;
}
#nodeInfo {
  max-height: 640px;
  overflow: auto;
  padding-left: 20px;
}
.canvas_img {
  position: relative;
}
.img_selector {
  position: absolute;
  background: #f00;
  opacity: 0.4;
  z-index: 9999;
}
.demo-spin-container {
  display: inline-block;
  width: 400px;
  height: 500px;
  position: absolute;
  left: 20px;
  top: 20px;
}
.itemclass {
  cursor: pointer;
  background: #f00;
  position: absolute;
  opacity: 0;
}
</style>
