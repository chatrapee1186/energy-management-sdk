const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const XLSX = require('xlsx')
const csv = require('csvtojson')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const findById = (id) => {
    return Project.findOne({
        where: {
            projectId: id,
        },
        attributes: ['projectId', 'clientId', 'code', 'name', 'description', 'address', 'isDisabled', 'isDeleted'],
    })
}

const deleteChildren = async (projectId, transaction) => {
    await AllowedMeter.update(
        {
            isDeleted: true,
        },
        {
            where: { projectId: projectId },
            transaction: transaction,
        },
    )
}

// create project by projectId
module.exports.create = async (req, res, next) => {
    try {
        const { clientId, name, code, userId, address, description, isDisabled } = req.body
        if (!name) return next([400, 'MISSING_NAME'])
        if (!code) return next([400, 'MISSING_CODE'])
        if (!clientId) return next([400, 'MISSING_CLIENT_ID'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])
        const data = await Project.create({
            clientId: clientId,
            code: code,
            name: name,
            address: address,
            description: description,
            createdUserId: userId,
            isDisabled: isDisabled,
            isDeleted: false,
        })
        const response = await findById(data.projectId)
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

// get project by projectId
module.exports.getById = async (req, res, next) => {
    try {
        const { projectId } = req.params
        if (!projectId) return next([400, 'MISSING_PROJECT_ID'])
        const response = await findById(projectId)
        return response ? res.jsonp(response) : next([404, 'PROJECT_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// update project by projectId
module.exports.updateById = async (req, res, next) => {
    try {
        const { projectId } = req.params
        const { name, clientId, address, description, userId, isDisabled, isDeleted } = req.body
        if (!projectId) return next([400, 'MISSING_PROJECT_ID'])
        if (!clientId) return next([400, 'MISSING_CLIENT_ID'])
        if (!name) return next([400, 'MISSING_NAME'])
        if (!address) return next([400, 'MISSING_ADDRESS'])
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (typeof isDisabled !== 'boolean') return next([400, 'MISSING_IS_DISABLED'])
        if (typeof isDeleted !== 'boolean') return next([400, 'MISSING_IS_DELETED'])
        await Project.sequelize.transaction(async (transaction) => {
            await Project.update(
                {
                    clientId: clientId,
                    name: name,
                    address: address,
                    description: description,
                    modifiedUserId: userId,
                    isDisabled: isDisabled,
                    isDeleted: isDeleted,
                },
                {
                    where: { projectId: projectId },
                    transaction: transaction,
                },
            )
            if (isDeleted) {
                await deleteChildren(projectId, transaction)
            }
        })
        const response = await findById(projectId)
        return response ? res.jsonp(response) : next([404, 'PROJECT_NOT_FOUND'])
    } catch (ex) {
        return next(ex)
    }
}

// search project by condition
module.exports.search = async (req, res, next) => {
    try {
        const { name, clientId, isDisabled, offset, limit } = req.query
        const condition = [{ isDeleted: false }]
        if (clientId) condition.push({ clientId: clientId })
        if (isDisabled) condition.push({ isDisabled: isDisabled === 'true' })
        if (name)
            condition.push({ [Op.or]: [{ name: { [Op.like]: `%${name}%` } }, { nameEn: { [Op.like]: `%${name}%` } }] })
        const data = await Project.findAndCountAll({
            where: condition.length ? { [Op.and]: condition } : undefined,
            offset: offset && limit ? parseInt(offset) : undefined,
            limit: offset && limit ? parseInt(limit) : undefined,
            order: [['name', 'ASC']],
            distinct: true,
            attributes: [
                'projectId',
                'name',
                'address',
                'isDisabled',
                [
                    Sequelize.literal(`(
                    select client.name
                    from client
                    where
                        client.clientId = project.clientId
                )`),
                    'clientName',
                ],
                [
                    Sequelize.literal(`(
                    select client.isDisabled
                    from client
                    where
                        client.clientId = project.clientId
                )`),
                    'clientIsDisabled',
                ],
                [
                    Sequelize.literal(`(
                    select count(*)
                    from allowedMeter
                    where
                        allowedMeter.projectId = project.projectId and allowedMeter.isDeleted = 0
                )`),
                    'allowedMeterCount',
                ],
            ],
            include: [
                {
                    model: Client,
                    attributes: [],
                },
                {
                    model: AllowedMeter,
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

const mergeData = (values) => {
    const temp = []
    return values.filter((elem) =>
        !temp.filter((item) => elem.projectCode === item.projectCode && elem.clientId === item.clientId).length
            ? temp.push(elem)
            : undefined,
    )
}

const getDuplicateList = (values, storage, clientId) => {
    const duplicateList = []
    values.forEach((elem, index) => {
        if (storage.filter((item) => elem.projectCode === item.code && clientId === item.clientId).length)
            duplicateList.push(`บรรทัดที่ ${index + 1} ช้อมูลซ้ำ`)
    })
    return duplicateList
}

const getInvalidList = (values) => {
    const invalidList = []
    values.forEach((elem, index) => {
        if (!elem.projectCode || !elem.nameTh || !elem.address)
            invalidList.push(`บรรทัดที่ ${index + 1} รูปแบบไม่ถูกต้อง`)
    })
    return invalidList
}

// import file to create projects
module.exports.import = async (req, res, next) => {
    try {
        const { userId, clientId } = req.body
        if (!userId) return next([400, 'MISSING_USER_ID'])
        if (!clientId) return next([400, 'MISSING_CLIENT_ID'])
        if (!req.file) return next([400, 'MISSING_FILE'])
        let data = []
        if (req.file.mimetype === 'text/csv') {
            data = await csv({ delimiter: '|' }).fromFile(req.file.path)
        } else {
            const workbook = XLSX.readFile(req.file.path)
            const sheetNameList = workbook.SheetNames
            data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
        }
        const invalidList = getInvalidList(data)
        const dataStorage = await Project.findAll({ attributes: ['code', 'clientId'] })
        const duplicateList = getDuplicateList(data, dataStorage, clientId)
        const errorList = invalidList.concat(duplicateList)
        if (errorList.length) {
            return next([400, { data: errorList }])
        }
        const dataList = mergeData(data)
        dataList.forEach(async (element) => {
            await Project.create({
                clientId: clientId,
                code: element.projectCode,
                name: element.nameTh,
                address: element.address,
                description: element.description,
                createdUserId: userId,
                isDisabled: false,
                isDeleted: false,
            })
        })
        const response = { count: dataList.length }
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.disable = async (req, res, next) => {
    try {
        const projectIds = req.body.projectId
        if (!projectIds) return next([400, 'MISSING_PROJECT_ID'])
        await Project.update({ isDisabled: true }, { where: { projectId: projectIds } })
        return res.jsonp({ projectId: projectIds })
    } catch (ex) {
        return next(ex)
    }
}

module.exports.delete = async (req, res, next) => {
    try {
        const projectIds = req.body.projectId
        if (!projectIds) return next([400, 'MISSING_PROJECT_ID'])
        await Project.sequelize.transaction(async (transaction) => {
            await Project.update(
                {
                    isDeleted: true,
                },
                {
                    where: { projectId: projectIds },
                    transaction: transaction,
                },
            )
            for (const projectId of projectIds) {
                await deleteChildren(projectId, transaction)
            }
        })
        return res.jsonp({ projectId: projectIds })
    } catch (ex) {
        return next(ex)
    }
}
