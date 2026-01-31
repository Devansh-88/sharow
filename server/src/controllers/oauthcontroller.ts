import { generateCodeVerifier, generateState, OAuth2RequestError } from "arctic"
import { githubClient, googleClient } from "@/lib/oauth"
import env from "../config/env"
import * as jose from 'jose'
import { generateRefreshToken } from "../utils/generateToken"
import { generateFromEmail } from 'unique-username-generator'
import * as cookies from '@/lib/cookies'
import axios from 'axios'
import { RequestHandler } from "express"
import * as z from "zod"
import prisma from "@/config/prisma"


export const redirectToGoogleOAuth: RequestHandler = (req, res) => {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const scopes = ["email", "openid", "profile"]

    const url = googleClient.createAuthorizationURL(state, codeVerifier, scopes)

    res.cookie('googleState', state, cookies.OAUTH_COOKIE_OPTIONS)
    res.cookie('googleCodeVerifier', codeVerifier, cookies.OAUTH_COOKIE_OPTIONS)

    res.redirect(url.toString())
}

export const googleOAuthCallback: RequestHandler = async (req, res) => {
    const Schema = z.object({
        googleState: z.string(),
        googleCodeVerifier: z.string(),
        state: z.string(),
        code: z.string()
    })

    const parsedData = Schema.safeParse({
        googleState: req.cookies?.googleState,
        googleCodeVerifier: req.cookies?.googleCodeVerifier,
        state: req.query?.state,
        code: req.query?.code
    })

    if (!parsedData.success) return res.fail(400, "BAD_REQUEST", "Google oauth cookies or queries were missing/invalid")
    const { googleState, googleCodeVerifier, state, code } = parsedData.data

    const clearCookies = () => {
        res.clearCookie('googleState', cookies.OAUTH_COOKIE_OPTIONS)
        res.clearCookie('googleCodeVerifier', cookies.OAUTH_COOKIE_OPTIONS)
    }

    if (googleState !== state) {
        clearCookies()
        return res.fail(400, "OAUTH_INVALID_STATE", "Google oauth state did not match")
    }

    var tokens
    try {
        tokens = await googleClient.validateAuthorizationCode(code, googleCodeVerifier)
    } catch (error) {
        if (error instanceof OAuth2RequestError) {
            clearCookies()
            //Incorrect authorization creds/code or redirect uri
            return res.fail(401, "OAUTH_UNAUTHORIZED", "Google oauth code was invalid, verification failed")
        }
        throw error
    }

    const idToken = tokens.idToken()


    const openid_config = await axios.get<{ jwks_uri: string }>("https://accounts.google.com/.well-known/openid-configuration", {
        headers: { "User-Agent": "MyAppServer/1.0 (+https://your.app)" }
    })

    const jwks_uri = openid_config.data.jwks_uri || 'https://www.googleapis.com/oauth2/v3/certs'


    const JWKresolver = jose.createRemoteJWKSet(new URL(jwks_uri))

    const decoded = await jose.jwtVerify<{ name: string, email: string }>(idToken, JWKresolver, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: env.GOOGLE_CLIENT_ID,
    })

    const { email } = decoded.payload


    //User basic auth
    const refreshToken = await generateRefreshToken(email)
    res.cookie('refreshToken', refreshToken, cookies.REFRESH_COOKIE_OPTIONS)

    if (!await prisma.user.findUnique({ where: { email } })) {
        const username = generateFromEmail(email, { randomDigits: 3, leadingFallback: "traveller" })
        await prisma.user.create({ data: { email, username } })
    }

    clearCookies()
    res.redirect('/')
}


export const redirectToGithubOAuth: RequestHandler = (req, res) => {
    const state = generateState()
    const scopes = ["user:email", 'read:user']

    const url = githubClient.createAuthorizationURL(state, scopes)
    res.cookie('githubState', state, cookies.OAUTH_COOKIE_OPTIONS)

    res.redirect(url.toString())
}

export const githubOAuthCallback: RequestHandler = async (req, res) => {
    const Schema = z.object({
        state: z.string(),
        code: z.string(),
        githubState: z.string()
    })

    const parsedData = Schema.safeParse({
        state: req.query?.state,
        code: req.query?.code,
        githubState: req.cookies?.githubState
    })
    if (!parsedData.success) return res.fail(400, "BAD_REQUEST", "Github oauth cookies or queries were missing/invalid")
    const { state, code, githubState } = parsedData.data


    const clearCookies = () => {
        res.clearCookie('githubState', cookies.OAUTH_COOKIE_OPTIONS)
    }

    if (state !== githubState) return res.fail(401, "OAUTH_INVALID_STATE", "Github oauth state was invalid")

    var tokens
    try {
        tokens = await githubClient.validateAuthorizationCode(code)
    } catch (error) {
        if (error instanceof OAuth2RequestError) {
            clearCookies()
            return res.fail(401, "OAUTH_UNAUTHRORIZED", "Github oauth authorization code was invalid")
        }
        throw error
    }

    const githubAccessToken = tokens.accessToken()

    const { data: { login: githubUsername, name } } = await axios.get<{ login: string, name: string }>('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubAccessToken}` }
    })
    const { data: emails } = await axios.get<{ primary: string }[]>('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubAccessToken}` }
    })

    const data = emails.find(obj => obj.primary)
    if (!data) {
        clearCookies()
        return res.fail(400, "OAUTH_EMAIL_NOT_FOUND", "Primary email not found in github account")
    }
    const email = data.primary



    if (!await prisma.user.findUnique({ where: { email } })) {
        let username
        if (await prisma.user.findUnique({ where: { username: githubUsername } })) {
            username = generateFromEmail(email, { randomDigits: 3, leadingFallback: "traveller" })
        }
        else {
            username = githubUsername
        }

        await prisma.user.create({ data: { email, username } })
    }


    const refreshToken = await generateRefreshToken(email)
    res.cookie('refreshToken', refreshToken, cookies.REFRESH_COOKIE_OPTIONS)
    clearCookies()
    res.redirect('/')
}
