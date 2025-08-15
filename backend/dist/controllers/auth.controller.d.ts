import { Request, Response, NextFunction } from 'express';
import { LoginRequest, RegisterRequest } from '@khs-crm/types';
export declare const login: (req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction) => Promise<void>;
export declare const register: (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshToken: (req: Request<{}, {}, {
    refreshToken: string;
}>, res: Response, next: NextFunction) => Promise<void>;
export declare const logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCurrentUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map