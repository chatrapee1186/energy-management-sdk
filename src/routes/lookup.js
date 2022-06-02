const router = require('express').Router()
const lookup = require('@mea-energy-sdk/controllers/lookup')

router.get('/client', lookup.fetchClient)
router.get('/project', lookup.fetchProject)

module.exports = router
