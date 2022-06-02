const router = require('express').Router()
const reports = require('@mea-energy-sdk/controllers/reports')

router.get('/client', reports.client)
router.get('/access/sum-month', reports.sumMonth)
router.get('/access/sum-month-by-method', reports.sumMonthByMethod)
router.get('/access/sum-year', reports.sumYear)
router.get('/meter/sum-month', reports.sumMonthByMeter)
router.get('/notify/send-outage/sum-month', reports.sumMonthSendOutage)
router.get('/notify/send-outage/sum-year', reports.sumYearSendOutage)

module.exports = router
