const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const AccessLogging = require('@mea-energy-sdk/models/AccessLogging')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')

// search access log
module.exports.search = async (req, res, next) => {
    try {
        const { meterNo, clientId, projectId, dateStart, dateEnd, offset, limit } = req.query
        const condition = []

        if (meterNo) condition.push({ meterNo: meterNo })
        if (projectId) condition.push({ projectId: projectId })

        let momentStart
        let momentEnd
        if (dateStart) {
            if (moment(dateStart, 'YYYY-MM-DD', true).isValid()) {
                momentStart = moment(dateStart, 'YYYY-MM-DD').startOf('day')
            } else {
                return next([400, 'MISSING_DATE_START_INVALID'])
            }
        }
        if (dateEnd) {
            if (moment(dateEnd, 'YYYY-MM-DD', true).isValid()) {
                momentEnd = moment(dateEnd, 'YYYY-MM-DD').endOf('day')
            } else {
                return next([400, 'MISSING_DATE_END_INVALID'])
            }
        }
        if (momentStart && momentEnd) {
            condition.push({ createdDate: { [Op.between]: [momentStart, momentEnd] } })
        } else {
            if (momentStart) condition.push({ createdDate: { [Op.gte]: momentStart } })
            if (momentEnd) condition.push({ createdDate: { [Op.lt]: momentEnd } })
        }

        const data = await AccessLogging.findAndCountAll({
            where: condition.length ? { [Op.and]: condition } : undefined,
            offset: offset && limit ? parseInt(offset) : undefined,
            limit: offset && limit ? parseInt(limit) : undefined,
            order: [['createdDate', 'DESC']],
            distinct: true,
            attributes: [
                [Sequelize.col('client.clientId'), 'clientId'],
                'clientCode',
                [Sequelize.col('client.name'), 'clientName'],
                'projectId',
                [Sequelize.col('project.name'), 'projectName'],
                'ca',
                'meterNo',
                'method',
                ['createdDate', 'accessDate'],
                'apiKey',
                'sdkVersion',
                'sdkPlatform',
            ],
            include: [
                {
                    model: Client,
                    attributes: [],
                    where: clientId ? { clientId: clientId } : undefined,
                },
                {
                    model: Project,
                    attributes: [],
                },
            ],
        })
        const response = { data: data.rows, count: data.count }
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}
