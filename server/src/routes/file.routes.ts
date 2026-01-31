import { uploadFile } from '@/controllers/uploadController'
import asyncHandler from '@/middlewares/asyncHandler'
import authMiddleware from '@/middlewares/authMiddleware'
import upload from '@/middlewares/mutlerMiddleware'
import express from 'express'

const router = express.Router()


router.post('/', authMiddleware, upload.single('bill_image'), asyncHandler(uploadFile))


export default router