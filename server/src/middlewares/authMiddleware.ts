import * as jose from 'jose'
import { generateUint8Array } from '@/utils/generateToken'
import env from '../config/env'
import { REFRESH_COOKIE_OPTIONS } from '@/lib/cookies'
import { RequestHandler } from 'express'
import prisma from '@/config/prisma'


const authMiddleware: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const accessToken = authHeader && authHeader.split(' ')[1]
    if (!accessToken) return res.fail(401, "TOKEN_NOT_FOUND", "Acesss token could not be found")

    var decoded
    try {
        decoded = await jose.jwtVerify<{ email: string }>(accessToken, generateUint8Array(env.ACCESS_TOKEN_SECRET))
    } catch (error) {
        if (error instanceof jose.errors.JOSEError) {
            const { code } = error
            if (code === "ERR_JWT_EXPIRED") return res.fail(401, "ACCESS_TOKEN_EXPIRED", "Access token expired, request a new one")
            res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
            res.fail(401, "INVALID_TOKEN", error.message)
        }
        throw error
    }

    const { payload: { email } } = decoded
    const user = await prisma.user.findUnique({ where: { email } })

    //Incase user was deleted by admin or devs or blacklisted, or anything like that, we logout the user
    if (!user) {
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
        return res.fail(401, "USER_NOT_FOUND", "Associated user could not be found, logging out")
    }

    const { id, username } = user
    req.user = { id, email, username }
    next()
}


export default authMiddleware