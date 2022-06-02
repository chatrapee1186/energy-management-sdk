const router = require('express').Router()
const profile = require('@mea-energy-sdk/controllers/profile')

router.get('', profile.getDetail)
router.get('/picture', profile.getPicture)

module.exports = router
