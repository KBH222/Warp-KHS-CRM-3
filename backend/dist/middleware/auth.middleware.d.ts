import { Request, Response, NextFunction } from 'express';
import { Role } from '@khs-crm/types';
interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map