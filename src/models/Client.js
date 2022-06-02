const { Sequelize } = require('sequelize')
const randomstring = require('randomstring')

const schema = {
    clientId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
    },
    clientCode: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: () => randomstring.generate(32),
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    nameEn: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.TEXT,
    },
    descriptionEn: {
        type: Sequelize.TEXT,
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
    webhookUrl: {
        type: Sequelize.STRING,
    },
    createdUserId: {
        type: Sequelize.STRING,
    },
    modifiedUserId: {
        type: Sequelize.STRING,
    },
}

module.exports = class extends Sequelize.Model {
    static init(sequelize) {
        super.init(schema, {
            tableName: 'client',
            modelName: 'client',
            timestamps: true,
            createdAt: 'createdDate',
            updatedAt: 'modifiedDate',
            sequelize,
        })
    }
}
