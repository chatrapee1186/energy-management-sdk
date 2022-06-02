const jwt = require('jsonwebtoken')
const axios = require('axios')
const fileType = require('file-type')

module.exports.getDetail = async (req, res, next) => {
    try {
        const decoded = jwt.decode(req.jwt)
        try {
            const response = await axios.get(process.env.SSO_PROFILE_URL, {
                headers: { Authorization: `Bearer ${decoded.access_token}` },
            })
            return res.jsonp(response.data)
        } catch (ex) {
            if (ex.response && ex.response.status === 401) {
                return next([401, ex.response.data.errors[0]])
            } else {
                throw ex
            }
        }
    } catch (ex) {
        return next(ex)
    }
}

module.exports.getPicture = async (req, res, next) => {
    try {
        const decoded = jwt.decode(req.jwt)
        try {
            const profile = await axios.get(process.env.SSO_PROFILE_URL, {
                headers: { Authorization: `Bearer ${decoded.access_token}` },
            })
            if (profile.data && profile.data.data && profile.data.data.profilePicture) {
                const response = await axios.get(profile.data.data.profilePicture, {
                    headers: { Authorization: `Bearer ${decoded.access_token}` },
                    responseType: 'arraybuffer',
                })
                const binaryType = await fileType.fromBuffer(response.data)
                res.status(200)
                    .contentType(binaryType ? binaryType.mime : 'image/png')
                    .send(response.data)
            } else {
                return next([404, 'data not found.'])
            }
        } catch (ex) {
            if (ex.response && ex.response.status === 401) {
                return next([401, ex.response.data.errors[0]])
            } else {
                throw ex
            }
        }
    } catch (ex) {
        return next(ex)
    }
}
