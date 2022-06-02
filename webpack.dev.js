const merge = require('webpack-merge')
const NodemonPlugin = require('nodemon-webpack-plugin')
const common = require('./webpack.common.js')
const path = require('path')

const target = path.join(process.cwd(), './dist')
module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new NodemonPlugin({
            watch: target
        })
    ]
})
