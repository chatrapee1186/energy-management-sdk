const router = require('express').Router()
const allowedMeter = require('@mea-energy-sdk/controllers/allowedMeter')

router.post('', allowedMeter.create)
router.get('/search', allowedMeter.search)
router.get('/auto-complete', allowedMeter.autoComplete)
router.put('/disable', allowedMeter.disable)
router.put('/delete', allowedMeter.delete)
router.get('/:allowedMeterId', allowedMeter.getById)
router.put('/:allowedMeterId', allowedMeter.updateById)

module.exports = router
