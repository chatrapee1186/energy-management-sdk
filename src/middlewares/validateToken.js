const jwt = require('jsonwebtoken')
const moment = require('moment')
const axios = require('axios')
const qs = require('qs')

const cookieOptions = {
    domain: process.env.COOKIE_DOMAIN,
    httpOnly: true,
    sameSite: process.env.APP_ENV === 'development' || process.env.APP_ENV === 'qa' ? 'none' : undefined,
}

module.exports = async (req, res, next) => {
    try {
        let jwtToken = req.cookies['jwt']
        if (!jwtToken) return next([400, 'MISSING_TOKEN'])
        try {
            await jwt.verify(jwtToken, process.env.JWT_KEY)
            const decoded = jwt.decode(jwtToken)
            if (!validateAccessExp(decoded.access_exp)) {
                const newToken = await refreshToken(decoded.refresh_token)
                jwtToken = getJWT(newToken.data, true)
                res.cookie('jwt', jwtToken, cookieOptions)
            }
            req.jwt = jwtToken
            return next()
        } catch (ex) {
            if (ex && ex.name === 'TokenExpiredError' && validateTime(ex.expiredAt)) {
                let decoded = jwt.decode(jwtToken)
                if (!validateAccessExp(decoded.access_exp)) {
                    const newToken = await refreshToken(decoded.refresh_token)
                    jwtToken = getJWT(newToken.data, true)
                } else {
                    jwtToken = getJWT(decoded, false)
                }
                res.cookie('jwt', jwtToken, cookieOptions)
                req.jwt = jwtToken
                return next()
            } else if (ex && ex.name === 'TokenExpiredError') {
                return next([401, ex.message])
            } else {
                throw ex
            }
        }
    } catch (ex) {
        console.log('validateToken error: ', error)
        return next(ex)
    }
}

const validateTime = (expiredAt) => {
    const millisec = new Date().getTime() - Date.parse(expiredAt)
    const duration = moment.duration(millisec, 'milliseconds')
    const hours = Math.floor(duration.asHours())
    const mins = Math.floor(duration.asMinutes()) - hours * 60
    return !!(hours < 1) && !!(mins <= 30)
}

const validateAccessExp = (access_exp) => {
    return new Date(parseInt(access_exp)) > new Date()
}

const getJWT = (accessToken, isNewAccessToken) => {
    const exp = isNewAccessToken
        ? moment()
              .add(accessToken.expires_in - 5, 's')
              .format('x')
        : accessToken.access_exp
    return jwt.sign(
        {
            access_token: accessToken.access_token,
            refresh_token: accessToken.refresh_token,
            access_exp: exp,
        },
        process.env.JWT_KEY,
        { expiresIn: '5m' },
    )
}

const refreshToken = (token) => {
    return axios.post(
        process.env.SSO_ACCESS_TOKEN_URL,
        qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: token,
            client_id: process.env.AUTH_CLIENT_ID,
            client_secret: process.env.AUTH_CLIENT_SECRET,
        }),
        {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        },
    )
}
