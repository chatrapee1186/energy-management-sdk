const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path')
const Copy = require('copy-webpack-plugin')

const target = path.join(process.cwd(), './dist')

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new Copy({
            patterns: [
                { from: 'package*.json', to: target },
                { from: '.npmrc', to: target },
            ],
        }),
    ],
})
