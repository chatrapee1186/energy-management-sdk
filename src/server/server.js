require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const path = require('path')
const {
    apiAccessLogMiddleware,
    apiAccessErrorLogMiddleware,
    storeAppErrorLog,
} = require('@mea/smart-office/modules/logger')
const { responseHandler, errorHandler } = require('@mea/smart-office/modules/api-middleware')
const { rabbitConnect, rabbitDisconnect } = require('@mea/smart-office/modules/rabbit-mq')
const { getInstance } = require('@mea/smart-office/modules/sequelize')
const initModels = require('@mea-energy-sdk/server/initModels')
const validateToken = require('@mea-energy-sdk/middlewares/validateToken')
const errorCode = require('@mea-energy-sdk/middlewares/errorCode')
const port = parseInt(process.env.PORT, 10) || 5000
const logDir = path.join(process.env.INIT_CWD, 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

const main = async () => {
    try {
        sequelize = await getInstance({
            server: process.env.DB_HOST,
            db: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
        })
        await rabbitConnect({
            chanels: [
                { key: 'logging', url: process.env.RABBIT_LOGGING_URL },
                { key: 'mbqueue', url: process.env.RABBIT_URL },
            ],
        })
        initModels.init(sequelize)
        sequelize.sync({ force: false })
        const app = express()
        const router = express.Router()
        const whitelist = process.env.FRONTEND_URL.split(',')
        const corsOptions = {
            credentials: true,
            origin: (origin, callback) => {
                if (whitelist.indexOf(origin) !== -1) {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            },
        }
        // app.use(cors(corsOptions))
        app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }))
        app.use(cookieParser())
        app.use(apiAccessLogMiddleware())
        app.use(apiAccessErrorLogMiddleware())
        app.use(responseHandler())
        app.use(bodyParser.json({ limit: '50mb' }))
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(process.env.BASE_PATH, router)

        router.use('/authen', require('../routes/authen'))
        router.use('/project', validateToken, require('../routes/project'))
        router.use('/client', validateToken, require('../routes/client'))
        router.use('/lookup', validateToken, require('../routes/lookup'))
        router.use('/allowedMeter', validateToken, require('../routes/allowedMeter'))
        router.use('/meter', validateToken, require('../routes/meter'))
        router.use('/access-log', validateToken, require('../routes/access-log'))
        router.use('/reports', validateToken, require('../routes/reports'))
        router.use('/profile', validateToken, require('../routes/profile'))
        router.use('/notify', validateToken, require('../routes/notify'))

        app.use(errorHandler(errorCode))
        app.listen(port, (err) => {
            if (err) throw err
            console.log(`> Ready on http://localhost:${port}`)
        })
        return app
    } catch (ex) {
        storeAppErrorLog(ex)
        console.error('main() error: ', ex)
    }
}

//to be called when process is restarted or terminated
const gracefulShutdown = async function (msg) {
    storeAppErrorLog(new Error(msg))
    await sequelize.close().catch()
    await rabbitDisconnect().catch()
    console.log(`Exit through ${msg}`)
}
//for nodemon restarts
process.once('SIGUSR2', async () => {
    await gracefulShutdown('nodemon restart')
    process.kill(process.pid, 'SIGUSR2')
})
//for app termination`
process.on('SIGINT', async () => {
    await gracefulShutdown('app termination')
    process.exit(0)
})
//for Heroku app termination
process.on('SIGTERM', async () => {
    await gracefulShutdown('Heroku app termination')
    process.exit(0)
})

module.exports = main()
