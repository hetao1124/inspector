const path = require('path')


module.exports = {
  lintOnSave: true,
  devServer: {
    port: 8080, // 端口号
    host: '127.0.0.1',
    https: false, // https:{type:Boolean}
    open: true, // 默认打开浏览器
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:17070',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }

}