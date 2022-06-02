const router = require('express').Router()
const notify = require('@mea-energy-sdk/controllers/notify')

router.get('/send-outage/search', notify.search)

module.exports = router
