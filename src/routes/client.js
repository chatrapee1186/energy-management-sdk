const router = require('express').Router()
const client = require('@mea-energy-sdk/controllers/client')

router.post('', client.create)
router.get('/search', client.search)
router.put('/disable', client.disable)
router.put('/delete', client.delete)
router.get('/:clientId', client.getById)
router.put('/:clientId', client.updateById)

module.exports = router
