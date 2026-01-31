declare global {
    namespace Express {
        interface Response {
            fail: (status?: number, code?: string, message?: string) => Response,
            success: (status?: number, data?: {}, message?: string) => Response
        }
        interface Request {
            user: {
                id: string,
                email: string,
                username: string
            }
        }
    }
}

export { }