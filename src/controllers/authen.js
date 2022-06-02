const jwt = require('jsonwebtoken')
const moment = require('moment')
const axios = require('axios')
const qs = require('qs')

const cookieOptions = {
    domain: process.env.COOKIE_DOMAIN,
    httpOnly: true,
    sameSite: process.env.APP_ENV === 'development' || process.env.APP_ENV === 'qa' ? 'none' : undefined,
}

module.exports.generate = async (req, res, next) => {
    try {
        const { authCode } = req.body
        if (!authCode) return next([400, 'MISSING_AUTH_CODE'])
        const token = await genToken(authCode)
        const jwtToken = getJWT(token.data)
        res.cookie('jwt', jwtToken, cookieOptions)
        return res.jsonp({})
    } catch (ex) {
        return next(ex)
    }
}

const getJWT = (accessToken) => {
    const exp = moment()
        .add(accessToken.expires_in - 5, 's')
        .format('x')
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

const genToken = (authCode) => {
    return axios.post(
        process.env.SSO_ACCESS_TOKEN_URL,
        qs.stringify({
            grant_type: 'authorization_code',
            code: authCode,
            client_id: process.env.AUTH_CLIENT_ID,
            client_secret: process.env.AUTH_CLIENT_SECRET,
            redirect_uri: process.env.AUTH_REDIRECT_URI,
        }),
        {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        },
    )
}

module.exports.remove = async (req, res, next) => {
    try {
        const jwtToken = req.cookies['jwt']
        if (!jwtToken) return next([400, 'MISSING_TOKEN'])
        const decoded = jwt.decode(jwtToken)
        if (!decoded.access_token) return next([400, 'MISSING_ACCESS_TOKEN'])
        await axios.post(process.env.SSO_LOGOUT_URL, null, {
            headers: {
                Authorization: `Bearer ${decoded.access_token}`,
            },
        })
        res.clearCookie('jwt')
        return next([401, 'LOGGED_OUT'])
    } catch (error) {
        return next(error)
    }
}
