const router = require('express').Router()
const meter = require('@mea-energy-sdk/controllers/meter')

router.get('/search', meter.search)

module.exports = router
