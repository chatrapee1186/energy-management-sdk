const router = require('express').Router()
const authen = require('@mea-energy-sdk/controllers/authen')

router.post('', authen.generate)
router.post('/logout', authen.remove)

module.exports = router
