import express from 'express'
import { analyzeBill, chatWithBill, getUserBills, getBillById } from '@/controllers/billController'
import asyncHandler from '@/middlewares/asyncHandler'
import authMiddleware from '@/middlewares/authMiddleware'
import upload from '@/middlewares/mutlerMiddleware'

const router = express.Router()

router.post('/analyze', authMiddleware, upload.single('bill_image'), asyncHandler(analyzeBill))

router.post('/chat', authMiddleware, asyncHandler(chatWithBill))

router.get('/', authMiddleware, asyncHandler(getUserBills))

router.get('/:billId', authMiddleware, asyncHandler(getBillById))

export default router
