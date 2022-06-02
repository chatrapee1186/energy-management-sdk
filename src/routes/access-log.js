const router = require('express').Router()
const accessLog = require('@mea-energy-sdk/controllers/access-log')

router.get('/search', accessLog.search)

module.exports = router
