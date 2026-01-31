import env from '@/config/env'
import * as jose from 'jose'

const encoder = new TextEncoder()

export const generateUint8Array = (JWT_SECRET: string) => encoder.encode(JWT_SECRET)



export const generateAccessToken = async (email: string) => {
    const accessToken = await new jose.SignJWT({ email })
        .setExpirationTime("2h")
        .setProtectedHeader({ alg: "HS256" })
        .sign(generateUint8Array(env.ACCESS_TOKEN_SECRET))
    return accessToken
}
export const generateRefreshToken = async (email: string) => {
    const refreshToken = await new jose.SignJWT({ email })
        .setExpirationTime("7d")
        .setProtectedHeader({ alg: "HS256" })
        .sign(generateUint8Array(env.REFRESH_TOKEN_SECRET))
    return refreshToken
}