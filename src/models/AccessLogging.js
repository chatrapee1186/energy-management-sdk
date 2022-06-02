const { Sequelize } = require('sequelize')
const Client = require('@mea-energy-sdk/models/Client')
const Project = require('@mea-energy-sdk/models/Project')

const schema = {
    recordNo: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    clientCode: {
        type: Sequelize.STRING(32),
        allowNull: true,
    },
    projectId: {
        type: Sequelize.UUID,
        allowNull: true,
    },
    ca: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    meterNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    method: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    apiKey: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    sdkVersion: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    sdkPlatform: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}

module.exports = class AccessLogging extends Sequelize.Model {
    static init(sequelize) {
        super.init(schema, {
            modelName: 'accessLogging',
            timestamps: true,
            createdAt: 'createdDate',
            updatedAt: 'modifiedDate',
            sequelize,
        })
        Client.hasMany(AccessLogging, {
            foreignKey: 'clientCode',
            sourceKey: 'clientCode',
            targetKey: 'clientCode',
        })
        AccessLogging.belongsTo(Client, {
            foreignKey: 'clientCode',
            sourceKey: 'clientCode',
            targetKey: 'clientCode',
        })
        Project.hasMany(AccessLogging, {
            foreignKey: 'projectId',
            sourceKey: 'projectId',
            targetKey: 'projectId',
        })
        AccessLogging.belongsTo(Project, {
            foreignKey: 'projectId',
            sourceKey: 'projectId',
            targetKey: 'projectId',
        })
    }
}
