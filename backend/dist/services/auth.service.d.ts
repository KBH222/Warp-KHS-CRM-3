import { User, RefreshToken } from '@prisma/client';
export declare function generateTokens(user: User, rememberMe?: boolean): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function verifyRefreshToken(token: string): Promise<{
    user: User;
    storedToken: RefreshToken;
}>;
export declare function generateResetToken(): string;
//# sourceMappingURL=auth.service.d.ts.map