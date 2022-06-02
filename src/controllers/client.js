const Client = require('@mea-energy-sdk/models/Client')
const Project = require('@mea-energy-sdk/models/Project')
const Sequelize = require('sequelize')
const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const Op = Sequelize.Op

const findById = (id) => {
    return Client.findOne({
        where: {
            clientId: id,
        },
        attributes: ['clientId', 'clientCode', 'name', 'description', 'webhookUrl', 'isDisabled', 'isDeleted'],
    })
}

const deleteChildren = async (clientId, transaction) => {
    await Project.update(
        {
            isDeleted: true,
        },
        {
            where: { clientId: clientId },
            transaction: transaction,
        },
    )
    const projects = await Project.findAll({
        where: { clientId: clientId },
        attributes: ['projectId'],
        transaction: transaction,
    })
    await AllowedMeter.update(
        {
            isDeleted: true,
        },
        {
            where: { projectId: projects.map((item) => item.projectId) },
            transaction: transaction,
        },
    )
}

// create client
module.exports.create = async (req, res, next) => {
    try {
        const { name, userId, isDisabled, description, webhookUrl } = req.body
        if (!name) return next([400, 'MISSING_NAME'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])
        const data = await Client.create({
            name: name,
            description: description,
            createdUserId: userId,
            webhookUrl: webhookUrl,
            isDisabled: isDisabled,
            isDeleted: false,
        })
        const response = await findById(data.clientId)
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

// get client by clientId
module.exports.getById = async (req, res, next) => {
    try {
        const { clientId } = req.params
        if (!clientId) return next([400, 'MISSING_CLIENT_ID'])
        const response = await findById(clientId)
        return response ? res.jsonp(response) : next([404, 'CLIENT_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// update client by clientId
module.exports.updateById = async (req, res, next) => {
    try {
        const { clientId } = req.params
        const { name, description, userId, webhookUrl, isDisabled, isDeleted } = req.body
        if (!clientId) return next([400, 'MISSING_CLIENT_ID'])
        if (!name) return next([400, 'MISSING_NAME'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])
        if (typeof isDeleted !== 'boolean') return next([400, 'MISSING_IS_DELETED'])
        await Client.sequelize.transaction(async (transaction) => {
            await Client.update(
                {
                    name: name,
                    description: description,
                    modifiedUserId: userId,
                    webhookUrl: webhookUrl,
                    isDisabled: isDisabled,
                    isDeleted: isDeleted,
                },
                {
                    where: { clientId: clientId },
                    transaction: transaction,
                },
            )
            if (isDeleted) {
                await deleteChildren(clientId, transaction)
            }
        })
        const response = await findById(clientId)
        return response ? res.jsonp(response) : next([404, 'CLIENT_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// search client by condition
module.exports.search = async (req, res, next) => {
    try {
        const { name, isDisabled, offset, limit } = req.query
        const condition = [{ isDeleted: false }]
        if (isDisabled) condition.push({ isDisabled: isDisabled === 'true' })
        if (name)
            condition.push({ [Op.or]: [{ name: { [Op.like]: `%${name}%` } }, { nameEn: { [Op.like]: `%${name}%` } }] })
        const data = await Client.findAndCountAll({
            where: condition.length ? { [Op.and]: condition } : undefined,
            attributes: [
                'clientId',
                'clientCode',
                'name',
                'isDisabled',
                [
                    Sequelize.literal(`(
                    select count(*)
                    from project AS project
                    where
                        project.clientId = client.clientId and project.isDeleted = 0
                )`),
                    'projectCount',
                ],
            ],
            offset: offset && limit ? parseInt(offset) : undefined,
            limit: offset && limit ? parseInt(limit) : undefined,
            order: [['name', 'ASC']],
            distinct: true,
            include: [
                {
                    model: Project,
                    attributes: [],
                },
            ],
        })
        return res.jsonp({ data: data.rows, count: data.count })
    } catch (ex) {
        return next(ex)
    }
}

// update isDisabled by clientList
module.exports.disable = async (req, res, next) => {
    try {
        const clientIds = req.body.clientId
        if (!clientIds) return next([400, 'MISSING_CLIENT_ID'])
        await Client.update({ isDisabled: true }, { where: { clientId: clientIds } })
        return res.jsonp({ clientId: clientIds })
    } catch (ex) {
        return next(ex)
    }
}

// update isDeleted by clientList
module.exports.delete = async (req, res, next) => {
    try {
        const clientIds = req.body.clientId
        if (!clientIds) return next([400, 'MISSING_CLIENT_ID'])
        await Client.sequelize.transaction(async (transaction) => {
            await Client.update(
                {
                    isDeleted: true,
                },
                {
                    where: { clientId: clientIds },
                    transaction: transaction,
                },
            )
            for (const clientId of clientIds) {
                await deleteChildren(clientId, transaction)
            }
        })

        return res.jsonp({ clientId: clientIds })
    } catch (ex) {
        return next(ex)
    }
}
