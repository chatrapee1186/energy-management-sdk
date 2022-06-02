const { Sequelize } = require('sequelize')
const Project = require('./Project')

const schema = {
    allowedMeterId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
    },
    projectId: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    ca: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    meterNo: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    isDisabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
    },
    isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    x: {
        type: Sequelize.DOUBLE,
    },
    y: {
        type: Sequelize.DOUBLE,
    },
    createdUserId: {
        type: Sequelize.STRING,
    },
    modifiedUserId: {
        type: Sequelize.STRING,
    },
}

module.exports = class AllowedMeter extends Sequelize.Model {
    static init(sequelize) {
        super.init(schema, {
            tableName: 'allowedMeter',
            modelName: 'allowedMeter',
            timestamps: true,
            createdAt: 'createdDate',
            updatedAt: 'modifiedDate',
            sequelize,
        })
        Project.hasMany(AllowedMeter, {
            foreignKey: {
                name: 'projectId',
                allowNull: false,
            },
        })
        AllowedMeter.belongsTo(Project, {
            foreignKey: {
                name: 'projectId',
                allowNull: false,
            },
        })
    }
    static findByCA(ca) {
        return this.findAll({
            where: {
                ca,
            },
        })
    }
}
