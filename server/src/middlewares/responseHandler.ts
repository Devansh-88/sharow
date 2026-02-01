import { RequestHandler } from "express";

const responseHandler: RequestHandler = (req, res, next) => {
    res.fail = (status = 500, code = "INTERNAL_ERROR", message = "Something went wrong !") => {
        return res.status(status).json({ success: false, code, message })
    }
    res.success = (status = 200, data = {}, message = "Successful request") => {
        return res.status(status).json({ success: true, ...data, message })
    }
    next()
}

export default responseHandler