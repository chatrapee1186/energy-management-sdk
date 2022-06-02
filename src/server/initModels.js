const Models = [
    require('@mea-energy-sdk/models/Client'),
    require('@mea-energy-sdk/models/Project'),
    require('@mea-energy-sdk/models/AllowedMeter'),
    require('@mea-energy-sdk/models/AccessLogging'),
    require('@mea-energy-sdk/models/SendOutage'),
]

module.exports.Models = Models
module.exports.init = (sequelize) => {
    Models.forEach((Model) => Model.init(sequelize))
}
