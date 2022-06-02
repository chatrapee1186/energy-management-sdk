const Sequelize = require('sequelize')
const Client = require('@mea-energy-sdk/models/Client')
const Project = require('@mea-energy-sdk/models/Project')
const Op = Sequelize.Op

//รายชื่อผู้ขอใช้งาน
module.exports.fetchClient = async (req, res, next) => {
    try {
        const { clientId } = req.query
        const condition = [{ isDeleted: false }]
        if (clientId) condition.push({ clientId })
        const response = await Client.findAll({
            attributes: ['clientId', 'name', 'isDisabled'],
            where: condition.length ? { [Op.and]: condition } : undefined,
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

//รายชื่อโครงการ
module.exports.fetchProject = async (req, res, next) => {
    try {
        const { clientId, projectId } = req.query
        const condition = [{ isDeleted: false }]
        if (clientId) condition.push({ clientId })
        if (projectId) condition.push({ projectId })
        const response = await Project.findAll({
            attributes: ['clientId', 'projectId', 'name', 'isDisabled'],
            where: condition.length ? { [Op.and]: condition } : undefined,
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}
