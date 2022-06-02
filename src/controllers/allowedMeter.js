const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const findById = (id) => {
    return AllowedMeter.findOne({
        where: {
            allowedMeterId: id,
        },
        attributes: [
            'allowedMeterId',
            'projectId',
            'ca',
            'meterNo',
            'name',
            'address',
            'isDisabled',
            'isDeleted',
            'x',
            'y',
            [Sequelize.col('project.client.clientId'), 'clientId'],
        ],
        include: [
            {
                model: Project,
                attributes: [],
                include: [
                    {
                        model: Client,
                        attributes: [],
                    },
                ],
            },
        ],
    })
}

// สร้าง allowedMeter
module.exports.create = async (req, res, next) => {
    try {
        const { projectId, meterNo, address, ca, name, isDisabled, userId } = req.body
        if (!projectId) return next([400, 'MISSING_PROJECT_ID'])
        if (!meterNo) return next([400, 'MISSING_METER_NO'])
        if (!address) return next([400, 'MISSING_ADDRESS'])
        if (!ca) return next([400, 'MISSING_CA'])
        if (!name) return next([400, 'MISSING_NAME'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])

        const existing = await AllowedMeter.findAll({ where: { ca: ca, meterNo: meterNo, isDeleted: false } })
        if (existing.length > 0) {
            return next([400, 'DUPLICATE_METER'])
        }
        const project = await Project.findOne({ where: { projectId: projectId } })
        if (!project || project.isDeleted) {
            return next([400, 'PROJECT_NOT_FOUND'])
        }
        const client = await Client.findOne({ where: { clientId: project.clientId } })
        if (!client || client.isDeleted) {
            return next([400, 'CLIENT_NOT_FOUND'])
        }

        const data = await AllowedMeter.create({
            projectId: projectId,
            meterNo: meterNo,
            address: address,
            ca: ca,
            name: name,
            isDisabled: isDisabled,
            createdUserId: userId,
        })
        const response = await findById(data.allowedMeterId)
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

// get allowedMeter by allowedMeterId
module.exports.getById = async (req, res, next) => {
    try {
        const { allowedMeterId } = req.params
        if (!allowedMeterId) return next([400, 'MISSING_ALLOWEDMETER_ID'])
        const response = await findById(allowedMeterId)
        return response ? res.jsonp(response) : next([404, 'ALLOWEDMETER_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// update allowedMeter by allowedMeterId
module.exports.updateById = async (req, res, next) => {
    try {
        const { allowedMeterId } = req.params
        const { name, address, userId, isDisabled, isDeleted } = req.body
        if (!allowedMeterId) return next([400, 'MISSING_ALLOWEDMETER_ID'])
        if (!name) return next([400, 'MISSING_NAME'])
        if (!address) return next([400, 'MISSING_ADDRESS'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])
        if (typeof isDeleted !== 'boolean') return next([400, 'MISSING_IS_DELETED'])
        await AllowedMeter.update(
            {
                name: name,
                address: address,
                modifiedUserId: userId,
                isDisabled: isDisabled,
                isDeleted: isDeleted,
            },
            {
                where: { allowedMeterId: allowedMeterId },
            },
        )
        const response = await findById(allowedMeterId)
        return response ? res.jsonp(response) : next([404, 'ALLOWEDMETER_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// ค้นหา allowedMeter จาก keyword
module.exports.search = async (req, res, next) => {
    try {
        const { ca, meterNo, clientId, projectId, isDisabled, offset, limit } = req.query
        const condition = [{ isDeleted: false }]
        if (ca) condition.push({ ca: ca })
        if (meterNo) condition.push({ meterNo: meterNo })
        if (projectId) condition.push({ projectId: projectId })
        if (isDisabled) condition.push({ isDisabled: isDisabled === 'true' })
        const data = await AllowedMeter.findAndCountAll({
            where: condition.length ? { [Op.and]: condition } : undefined,
            offset: offset && limit ? parseInt(offset) : undefined,
            limit: offset && limit ? parseInt(limit) : undefined,
            order: [['meterNo', 'ASC']],
            distinct: true,
            attributes: [
                'allowedMeterId',
                'meterNo',
                'ca',
                'address',
                'isDisabled',
                [Sequelize.col('project.name'), 'projectName'],
                [Sequelize.col('project.isDisabled'), 'projectIsDisabled'],
                [Sequelize.col('project.client.name'), 'clientName'],
                [Sequelize.col('project.client.isDisabled'), 'clientIsDisabled'],
            ],
            include: [
                {
                    model: Project,
                    attributes: [],
                    include: [
                        {
                            model: Client,
                            attributes: [],
                            where: clientId ? { clientId: clientId } : undefined,
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

// ค้นหา allowedMeter จาก keyword
module.exports.autoComplete = async (req, res, next) => {
    try {
        const { keyword } = req.query
        const condition = [{ isDeleted: false }]
        condition.push({ [Op.or]: [{ meterNo: { [Op.like]: `%${keyword}%` } }, { ca: { [Op.like]: `%${keyword}%` } }] })
        const data = await AllowedMeter.findAll({
            where: condition.length ? { [Op.and]: condition } : undefined,
            attributes: ['meterNo', 'ca'],
        })
        const response = data.map((element) => {
            return {
                text: `รหัสเครื่องวัดฯ: ${element.dataValues.meterNo} บัญชีแสดงสัญญา: ${element.dataValues.ca}`,
                meterNo: element.dataValues.meterNo,
                ca: element.dataValues.ca,
            }
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.disable = async (req, res, next) => {
    try {
        const allowedmeterIds = req.body.allowedmeterId
        if (!allowedmeterIds) return next([400, 'MISSING_ALLOWED_METER_ID'])
        await AllowedMeter.update({ isDisabled: true }, { where: { allowedMeterId: allowedmeterIds } })
        return res.jsonp({ allowedMeterId: allowedmeterIds })
    } catch (ex) {
        return next(ex)
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const allowedmeterIds = req.body.allowedmeterId
        if (!allowedmeterIds) return next([400, 'MISSING_ALLOWED_METER_ID'])
        await AllowedMeter.update({ isDeleted: true }, { where: { allowedMeterId: allowedmeterIds } })
        return res.jsonp({ allowedMeterId: allowedmeterIds })
    } catch (ex) {
        return next(ex)
    }
}
