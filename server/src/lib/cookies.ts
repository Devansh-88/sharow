type CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: number
}

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, //7d
}
export const OAUTH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    maxAge: 5 * 60 * 1000, //5min
    sameSite: "lax",
    secure: true
}
