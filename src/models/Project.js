const { Sequelize } = require('sequelize')
const Client = require('./Client')

const schema = {
    projectId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
    },
    clientId: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    nameEn: {
        type: Sequelize.STRING,
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    addressEn: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.STRING,
    },
    descriptionEn: {
        type: Sequelize.STRING,
    },
    isDisabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdUserId: {
        type: Sequelize.STRING,
    },
    modifiedUserId: {
        type: Sequelize.STRING,
    },
}

module.exports = class Project extends Sequelize.Model {
    static init(sequelize) {
        super.init(schema, {
            tableName: 'project',
            modelName: 'project',
            timestamps: true,
            createdAt: 'createdDate',
            updatedAt: 'modifiedDate',
            sequelize,
        })
        Client.hasMany(Project, {
            foreignKey: {
                name: 'clientId',
                allowNull: false,
            },
        })
        Project.belongsTo(Client, {
            foreignKey: {
                name: 'clientId',
                allowNull: false,
            },
        })
    }
}
