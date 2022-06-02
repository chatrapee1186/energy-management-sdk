const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const SendOutage = require('@mea-energy-sdk/models/SendOutage')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')

module.exports.search = async (req, res, next) => {
    try {
        const { clientId, projectId, meterNo, dateStart, dateEnd, offset, limit } = req.query
        const condition = []

        if (meterNo) condition.push({ meterNo: meterNo })

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
            condition.push({ notifyDate: { [Op.between]: [momentStart, momentEnd] } })
        } else {
            if (momentStart) condition.push({ notifyDate: { [Op.gte]: momentStart } })
            if (momentEnd) condition.push({ notifyDate: { [Op.lt]: momentEnd } })
        }

        const data = await SendOutage.findAndCountAll({
            attributes: [
                [Sequelize.col('allowedMeter.project.client.clientId'), 'clientId'],
                [Sequelize.col('allowedMeter.project.client.clientCode'), 'clientCode'],
                [Sequelize.col('allowedMeter.project.client.name'), 'clientName'],
                [Sequelize.col('allowedMeter.project.projectId'), 'projectId'],
                [Sequelize.col('allowedMeter.project.name'), 'projectName'],
                'ca',
                'meterNo',
                'notifyDate',
                'ffmStatus',
                'ffmDoneDate',
                'telNo',
            ],
            where: condition.length ? { [Op.and]: condition } : undefined,
            offset: offset && limit ? parseInt(offset) : undefined,
            limit: offset && limit ? parseInt(limit) : 50,
            order: [['notifyDate', 'DESC']],
            include: [
                {
                    model: AllowedMeter,
                    attributes: [],
                    required: true,
                    where: {
                        //Do this way because can not add two foreign keys
                        meterNo: { [Op.col]: 'SendOutage.meterNo' },
                    },
                    include: [
                        {
                            model: Project,
                            attributes: [],
                            required: true,
                            where: projectId ? { projectId: projectId } : undefined,
                            include: [
                                {
                                    model: Client,
                                    attributes: [],
                                    required: true,
                                    where: clientId ? { clientId: clientId } : undefined,
                                },
                            ],
                        },
                    ],
                },
            ],
        })
        const response = { data: data.rows, count: data.count }
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}
