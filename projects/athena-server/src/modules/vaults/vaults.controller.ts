import { Response, NextFunction } from 'express';

import {Controller, Route, HTTPMethods} from '@kangojs/core';

import {
    CreateVaultRequest, CreateVaultResponse,
    GetVaultResponse,
    UpdateVaultRequest, UpdateVaultResponse, VaultsQueryParams,
    VaultsURLParams
} from "@ben-ryder/athena-js-lib";
import {VaultsService} from "./vaults.service";
import {RequestWithContext} from "../../common/request-with-context";


@Controller({
    path: "/v1/vaults",
    identifier: "vaults-controller"
})
export class VaultsController {
    constructor(
      private vaultsService: VaultsService
    ) {}

    @Route({
        httpMethod: HTTPMethods.POST,
        bodyShape: CreateVaultRequest
    })
    async add(req: RequestWithContext, res: Response, next: NextFunction) {
        let newVault: CreateVaultResponse;

        try {
            newVault = await this.vaultsService.add(req.context.user.id, req.body);
        }
        catch(e) {
            return next(e);
        }

        return res.send(newVault);
    }

    @Route({
        path: '/:vaultId',
        httpMethod: HTTPMethods.GET,
        paramsShape: VaultsURLParams
    })
    async get(req: RequestWithContext, res: Response, next: NextFunction) {
        let vault: GetVaultResponse | null;

        try {
            vault = await this.vaultsService.getWithAccessCheck(req.context.user.id, req.params.vaultId);
        }
        catch (e) {
            return next(e);
        }

        return res.send(vault);
    }

    @Route({
        path: '/:vaultId',
        httpMethod: HTTPMethods.PATCH,
        bodyShape: UpdateVaultRequest,
        paramsShape: VaultsURLParams
    })
    async update(req: RequestWithContext, res: Response, next: NextFunction) {
        let updatedVault: UpdateVaultResponse;

        try {
            updatedVault = await this.vaultsService.updateWithAccessCheck(req.context.user.id, req.params.vaultId, req.body);
        }
        catch (e) {
            return next(e);
        }

        return res.send(updatedVault);
    }

    @Route({
        path: '/:vaultId',
        httpMethod: HTTPMethods.DELETE,
        paramsShape: VaultsURLParams
    })
    async delete(req: RequestWithContext, res: Response, next: NextFunction) {
        try {
            await this.vaultsService.deleteWithAccessCheck(req.context.user.id, req.params.vaultId);
        }
        catch (e) {
            return next(e);
        }
        return res.send();
    }

    @Route({
        httpMethod: HTTPMethods.GET,
        queryShape: VaultsQueryParams
    })
    async list(req: RequestWithContext, res: Response, next: NextFunction) {
        try {
            const response =  await this.vaultsService.list(req.context.user.id, req.params);
            return res.send(response);
        }
        catch (e) {
            return next(e);
        }
    }
}
