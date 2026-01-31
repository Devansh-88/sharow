import { RequestHandler } from "express"

type AsyncHandler = (fn: RequestHandler) => RequestHandler

const asyncHandler: AsyncHandler = (controllerFn) => {
    return (req, res, next) => {
        Promise.resolve(controllerFn(req, res, next)).catch(next)
    }
}

export default asyncHandler