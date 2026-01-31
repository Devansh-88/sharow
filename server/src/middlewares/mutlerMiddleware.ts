import { RequestHandler } from "express";
import fs from 'fs/promises'
import multer from 'multer'

export const checkUploadPath: RequestHandler = async (req, res, next) => {
    await fs.mkdir('tmp', { recursive: true })
    next()
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'tmp')
    },
    filename: (req, file, cb) => {
        const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e6) + "-" + file.originalname
        cb(null, uniqueFilename)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 //2mb
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) return cb(null, true)
        return cb(new Error("Invalid File type"))
    }
})

export default upload


