const path = require('path')
const fs = require('fs')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const nodeModules = fs
    .readdirSync(path.resolve('./node_modules'))
    .filter((folder) => {
        return ['.bin'].indexOf(folder) === -1
    })
    .reduce((mods, mod) => {
        mods[mod] = `commonjs ${mod}`
        return mods
    }, {})

module.exports = {
    entry: {
        index: './src/server/server.js',
    },
    target: 'node',
    node: {
        __dirname: true,
    },
    externals: nodeModules,
    output: {
        filename: '[name].js',
        path: path.resolve('dist'),
    },
    plugins: [new CleanWebpackPlugin()],
    resolve: {
        alias: {
            '@mea-energy-sdk': path.resolve(process.cwd(), './src'),
        },
    },
}
