import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: string
            isVerified: boolean
            avatar?: string
            token?: string // Backend JWT token
        }
    }

    interface User {
        id: string
        email: string
        name: string
        role: string
        isVerified: boolean
        avatar?: string
        token?: string // Backend JWT token
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        isVerified: boolean
        avatar?: string
        backendToken?: string // Backend JWT token stored in JWT
    }
}