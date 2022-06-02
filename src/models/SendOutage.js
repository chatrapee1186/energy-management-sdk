const Sequelize = require('sequelize')
const AllowedMeter = require('./AllowedMeter')

const schema = {
    sendOutageId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
    },
    ca: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    meterNo: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    telNo: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    ffmFailId: {
        type: Sequelize.STRING(36),
        allowNull: true,
    },
    ffmParentFailId: {
        type: Sequelize.STRING(36),
        allowNull: true,
    },
    ffmStatus: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    ffmDoneDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    notifyDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
}

module.exports = class SendOutage extends Sequelize.Model {
    static init(sequelize) {
        super.init(schema, {
            modelName: 'sendOutage',
            timestamps: true,
            createdAt: 'createdDate',
            updatedAt: 'updatedDate',
            sequelize,
        })
        AllowedMeter.hasMany(SendOutage, {
            foreignKey: 'ca',
            sourceKey: 'ca',
            targetKey: 'ca',
        })
        SendOutage.belongsTo(AllowedMeter, {
            foreignKey: 'ca',
            sourceKey: 'ca',
            targetKey: 'ca',
        })
    }
}
