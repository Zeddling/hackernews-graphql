import * as jwt from "jsonwebtoken"
import { auth } from "./constants";

export interface AuthTokenPayload {
    userId: number
}

export function decodeAuthHeader(authHeader: String): AuthTokenPayload {
    const token = authHeader.replace("Bearer ", "")

    if (!token) {
        throw new Error("No token found");
    }

    return jwt.verify(
        token, 
        process.env.REACT_APP_SECRET || auth.TEST_SECRET
    ) as AuthTokenPayload
}
