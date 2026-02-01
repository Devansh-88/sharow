import { githubOAuthCallback, googleOAuthCallback, redirectToGithubOAuth, redirectToGoogleOAuth } from '@/controllers/oauthcontroller'
import asyncHandler from '@/middlewares/asyncHandler'
import express from 'express'

const router = express.Router()

router.get('/google', asyncHandler(redirectToGoogleOAuth))
router.get('/google/callback', asyncHandler(googleOAuthCallback))

router.get('/github', asyncHandler(redirectToGithubOAuth))
router.get('/google', asyncHandler(githubOAuthCallback))

export default router