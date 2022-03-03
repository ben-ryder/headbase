import { Controller, Route, HTTPMethods } from '@kangojs/kangojs';
import { Request, Response, NextFunction } from 'express';

import { CheckShape } from "./shapes/check.shape";
import { LoginShape } from "./shapes/login.shape";
import { RequestWithDto } from "@kangojs/class-validation";


@Controller('/v1/auth')
class AuthController {
    constructor() {
    }

    @Route({
        path: '/login',
        httpMethod: HTTPMethods.POST,
        bodyShape: LoginShape
    })
    async login(req: RequestWithDto, res: Response, next: NextFunction) {
        const loginDetails = req.bodyDto;
        return res.send(`You have just attempted to login via /auth/login [POST].`);
    }

    @Route({
        path: '/logout',
        httpMethod: HTTPMethods.POST,
    })
    async logout(req: Request, res: Response, next: NextFunction) {
        return res.send(`You have just attempted to log out via /auth/logout [POST].`);
    }

    @Route({
        path: '/check',
        httpMethod: HTTPMethods.POST,
        bodyShape: CheckShape
    })
    async check(req: Request, res: Response, next: NextFunction) {
        return res.send(`You have just attempted to check a user via /auth/check [POST].`);
    }
}

export default AuthController;
