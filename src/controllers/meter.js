const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const Sequelize = require('sequelize')
const axios = require('axios')
const qs = require('qs')

const getName = (data) => {
    return [data.title, data.first_name, data.last_name].filter((item) => item).join(' ')
}

const getAddress = (data) => {
    const addressList = [
        data.house_num1,
        data.house_num2,
        data.house_sub,
        data.village,
        data.floor,
        data.soi,
        data.street,
        data.subdistrict,
        data.district,
        data.province,
        data.postcode,
    ]
    return addressList.filter((item) => item).join(' ')
}

module.exports.search = async (req, res, next) => {
    try {
        const { meterNo } = req.query
        if (!meterNo) return next([400, 'MISSING_METER_NO'])
        try {
            // get address, ca, name from mea api
            const responseMeter = await axios.post(process.env.METER_DETAIL_URL, qs.stringify({ ui: meterNo }), {
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
            })
            const data = responseMeter.data
            const ca = data.ca
                ? data.ca.toString().length === 9
                    ? data.ca.toString()
                    : data.ca.toString().padStart(9, '0')
                : null
            const response = {
                ca: ca,
                name: getName(data.address_meter),
                address: getAddress(data.address_meter),
            }
            return res.jsonp(response)
        } catch (ex) {
            if (ex.response) {
                return next([
                    500,
                    {
                        title: 'RESOURCE_FAIL',
                        detail: `Call resource service fail with status: ${ex.response.status}, text: ${ex.response.statusText}`,
                    },
                ])
            } else {
                throw ex
            }
        }
    } catch (ex) {
        return next(ex)
    }
}
