import * as argon2 from 'argon2'
import { uuid } from 'uuidv4'
import env from '../config/env'
import { sendOtp } from '@/services/nodemailer'
import { generateAccessToken, generateRefreshToken, generateUint8Array } from '../utils/generateToken'
import { REFRESH_COOKIE_OPTIONS } from '@/lib/cookies'
import * as jose from 'jose'
import { RequestHandler } from 'express'
import prisma from '@/config/prisma'
import { z } from 'zod'

export const signupController: RequestHandler = async (req, res) => {
    const Schema = z.object({
        email: z.email({ error: "Invalid email" }).toLowerCase().trim(),
        password: z.string()
            .min(8, { error: "Password must be at least 8 characters long" })
            .max(20, { error: "Password cannot exceed 20 characters" })
            .regex(/[A-Z]/, { error: "Password must contain at least one uppercase letter" })
            .regex(/[a-z]/, { error: "Password must contain at least one lowercase letter" })
            .regex(/[0-9]/, { error: "Password must contain at least one number" })
            .regex(/[^A-Za-z0-9\s]/, { error: "Password must contain at least one special character" }).trim(),
        username: z
            .string({
                message: "Username is required"
            })
            .trim() // Automatically removes leading/trailing spaces
            .min(3, { message: "Username too short" })
            .max(25, { message: "Username too long" })
            .regex(/^[a-zA-Z0-9._-]+$/, {
                message: "Only letters, numbers, ., -, and _ allowed",
            })
    })
    const parsedData = Schema.safeParse(req.body)
    console.log(parsedData)
    if (!parsedData.success) return res.fail(400, "BAD_REQUEST", parsedData.error.issues[0].message)

    const { email, password, username } = parsedData.data
    const a = prisma.user.findFirst({})

    //Check if email already exists
    if (await prisma.user.findUnique({ where: { email } })) return res.fail(409, "EMAIL_TAKEN", "Email is already registered")

    //Check if username is taken 
    if (await prisma.user.findUnique({ where: { username } })) return res.fail(409, "USERNAME_TAKEN", "Username is already taken")

    //Hashing password
    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 1
    })

    //Creating and hashing otp
    const otp = Math.floor((Math.random() * (1e6 - 1e5)) + 1e5)
    const otpHash = await argon2.hash(otp.toString(), {
        type: argon2.argon2id,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 1,
    })
    const otpUUID = uuid()

    //Checking OtpRequestLimit
    // const emailSession = await OtpRequestLimit.findOne({ email })
    // if (emailSession) {
    //     if (emailSession.requests > 3) return res.fail(429, "EMAIL_SESSION_LIMIT", "Otp request limit reached for email, please try after 10min")
    //     await OtpRequestLimit.updateOne({ email }, { $inc: { requests: 1 } })
    // }
    // else {
    //     await OtpRequestLimit.create({ email })
    // }

    //Creating OtpSession
    await prisma.otpSession.create({ data: { email, passwordHash, username, otpHash, otpUUID } })

    //Sending otp using nodemailer via email
    sendOtp(email, otp)

    //Sending a cookie containing otpUUID
    res.cookie('otpUUID', otpUUID, {
        sameSite: "lax",
        secure: true,
        httpOnly: true,
        maxAge: 5 * 60 * 1000,
    })

    res.success(200, {}, "Registeration process initiated, otp sent via email")

}

export const otpVerificationController: RequestHandler = async (req, res) => {
    const enteredOtp = req.body?.otp
    if (!enteredOtp) return res.fail(400, "INVALID_OTP_FORMAT", "Entered otp had an invalid format")

    const otpUUID = req.cookies?.otpUUID
    if (!otpUUID) return res.fail(410, "SESSION_EXPIRED", "Otp session expired, please re-signup")

    const token = await prisma.otpSession.findUnique({ where: { otpUUID } })
    if (!token) return res.fail(410, "SESSION_EXPIRED", "Otp session expired, please re-signup")

    //Extracting OtpSession data
    const { otpHash, email, passwordHash, username, attempts } = token

    //Current attempt
    const attemptNumber = attempts + 1
    if (attemptNumber > 3) return res.fail(429, "OTP_SESSION_LIMIT", "You have excceded the no of attempts to enter otp, please request a new one")



    //Verifying otp (Expensive)
    const isValid = await argon2.verify(otpHash, enteredOtp.toString())

    //Updating attempts now so that, only updated if hash veification doesnt throw
    await prisma.otpSession.update({
        where: { otpUUID },
        data: {
            attempts: { increment: 1 }
        }
    })
    if (!isValid) return res.fail(400, "INCORRECT_OTP", "Incorrect OTP")

    //Creating new user
    if (await prisma.user.findFirst({
        where: {
            OR: [
                { email }, { username }
            ]
        }
    })) return res.fail(409, "USER_EXISTS", "User already exists")
    const user = await prisma.user.create({ data: { email, passwordHash, username } })


    //Generating tokens, sending cookie and auth data
    const accessToken = await generateAccessToken(email)
    const refreshToken = await generateRefreshToken(email)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)

    //Deleting OtpSession (More efficent > auto delete), but no need to await since, if it throws ttl is backup and otherwise it will be deleted in bg
    await prisma.otpSession.delete({ where: { otpUUID } })
    res.clearCookie('otpUUID', {
        sameSite: "lax",
        secure: true,
        httpOnly: true,
        maxAge: 5 * 60 * 1000,
    })

    //###REMOVE/CHANGE LATER, send only basic, non-sensitive, required user data to frontend
    res.success(201, { user: { username, email, _id: user.id }, accessToken }, "Signup Successful")

}


export const loginController: RequestHandler = async (req, res) => {
    const { email, password } = req.body

    //Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.fail(400, "USER_NOT_FOUND", "Email not registered")

    //Check if password mathces
    const { passwordHash, username, id } = user
    if (!passwordHash) return res.fail(400, "PASSWORD_NOT_FOUND", "You do not have a password set, please login using other methods or use 'Forgot Password' to make a new one")

    if (!await argon2.verify(passwordHash, password)) return res.fail(400, "INVALID_PASSWORD", "Password is invalid")

    //Generating tokens, sending cookie and auth data
    const accessToken = await generateAccessToken(email)
    const refreshToken = await generateRefreshToken(email)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)

    //###REMOVE/CHANGE LATER, send only basic, non-sensitive, required user data to frontend
    res.success(200, { accessToken, user: { email, username, id } }, "Login Successful")

}


export const resendOtpController: RequestHandler = async (req, res) => {
    const otpUUID = req.cookies?.otpUUID
    if (!otpUUID) return res.fail(410, "SESSION_EXPIRED", "Otp session expired, please re-signup")

    //Checking no. of attempts for the email session
    const session = await prisma.otpSession.findUnique({ where: { otpUUID } })
    if (!session) return res.fail(410, "SESSION_EXPIRED", "Otp session expired, please re-signup")
    const { email } = session

    // const requestLimit = await OtpRequestLimit.findOne({ email })
    // if (!requestLimit) return res.fail(410, "SESSION_EXPIRED", "Otp session expired, please re-signup")
    // const { requests } = requestLimit

    // const requestNumber = requests + 1
    // if (requestNumber > 4) return res.fail(429, "EMAIL_SESSION_LIMIT", "Otp request limit reached for email, please try after 10min")

    await prisma.otpSession.update({
        where:
        {
            otpUUID
        },
        data: {
            attempts: { increment: 1 }
        }
    })

    //Creating and sending a new otp
    const otp = Math.floor((Math.random() * (1e6 - 1e5)) + 1e5)
    const otpHash = await argon2.hash(otp.toString(), {
        type: argon2.argon2id,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 1,
    })

    sendOtp(email, otp)

    //Updating OtpSession data
    await prisma.otpSession.update({
        where: { otpUUID },
        data: { attempts: 0, otpHash, createdAt: Date.now().toString() }
    })

    return res.success(200, {}, "Otp resent")
}


export const refreshTokenController: RequestHandler = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) return res.fail(401, "TOKEN_NOT_FOUND", "Refresh token was missing")

    //Extracting data
    var decoded
    try {
        decoded = await jose.jwtVerify<{ email: string }>(refreshToken, generateUint8Array(env.REFRESH_TOKEN_SECRET))
    } catch (error) {
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
        if (error instanceof jose.errors.JOSEError) {
            const { code } = error
            if (code === "ERR_JWT_EXPIRED") return res.fail(401, "REFRESH_TOKEN_EXPIRED", "Refresh token expired")
            if (code === "ERR_SIGNATURE_VERIFICATION_FAILED") return res.fail(401, "INVALID_SIGNATURE", "Token signature has been tampered with")
            return res.fail(500, error.code, error.message)
        }
        else throw error
    }

    const { payload: { email } } = decoded

    //Creating new accessToken and fetching auth data
    const accessToken = await generateAccessToken(email)
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
        res.fail(401, "USER_NOT_FOUND", "User does not exist")
    }

    res.success(200, { accessToken, user })

}

export const logoutController: RequestHandler = (req, res) => {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
    return res.sendStatus(204)
}
