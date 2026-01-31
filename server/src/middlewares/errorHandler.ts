import { ErrorRequestHandler } from "express"

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const status = err.status || 500
    const code = err.code || "INTERNAL_ERROR"
    const message = err.message || "Something went wrong"

    console.error(err.stack)
    res.status(status).json({ success: false, code, message })
}


export default errorHandler