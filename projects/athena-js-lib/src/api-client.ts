import axios from 'axios';

import { AthenaEncryption } from './encryption';
import {
    AthenaNoAccessTokenError,
    AthenaNoEncryptionKeyError,
    AthenaNoRefreshTokenError,
    AthenaRequestError,
    AthenaDataDeleteError,
    AthenaDataLoadError,
    AthenaDataSaveError
} from './errors';
import {UserDto} from "./schemas/users/dtos/user.dto";
import {LoginResponse} from "./schemas/auth/response/login.auth.response";
import {RefreshResponse} from "./schemas/auth/response/refresh.auth.response";
import {CreateNoteResponse} from "./schemas/notes/response/create.notes.response";
import {UpdateNoteResponse} from "./schemas/notes/response/update.notes.response";
import {CreateUserRequest} from "./schemas/users/request/create.users.request";
import {InfoDto} from "./schemas/info/dtos/info.dto";
import {CreateUserResponse} from "./schemas/users/response/create.users.response";
import {NoKeysUserDto} from "./schemas/users/dtos/no-keys-user.dto";
import {CreateVaultRequest} from "./schemas/vaults/request/create.vaults.request";
import {VaultsQueryParams} from "./schemas/vaults/request/query-params.vaults.request";
import {UpdateVaultRequest} from "./schemas/vaults/request/update.vaults.request";
import {GetVaultsResponse} from "./schemas/vaults/response/get.vaults.response";
import {GetVaultResponse} from "./schemas/vaults/response/get.vault.response";
import {AthenaErrorIdentifiers} from "./error-identifiers";
import {VaultDto} from "./schemas/vaults/dtos/vault.dto";
import {CreateNoteRequest} from "./schemas/notes/request/create.notes.request";
import {NotesQueryParams} from "./schemas/notes/request/query-params.notes.request";
import {GetNotesResponse} from "./schemas/notes/response/get.notes.response";
import {NoteDto} from "./schemas/notes/dtos/note.dto";
import {GetNoteResponse} from "./schemas/notes/response/get.note.response";
import {UpdateNoteRequest} from "./schemas/notes/request/update.notes.request";
import {GetTemplateResponse} from "./schemas/templates/response/get.template.response";
import {UpdateTemplateRequest} from "./schemas/templates/request/update.templates.request";
import {TemplatesQueryParams} from "./schemas/templates/request/query-params.templates.request";
import {TemplateDto} from "./schemas/templates/dtos/template.dto";
import {GetTemplatesResponse} from "./schemas/templates/response/get.templates.response";
import {CreateTemplateRequest} from "./schemas/templates/request/create.templates.request";
import {CreateTemplateResponse} from "./schemas/templates/response/create.template.response";


export interface QueryOptions {
    url: string,
    method: 'GET'|'POST'|'PATCH'|'DELETE',
    data?: object,
    params?: object,
    noAuthRequired?: boolean,
    requiresEncryptionKey?: boolean
}

export type DataLoader<T> = () => Promise<T|null>;
export type DataSaver<T> = (data: T) => Promise<void>;
export type DataDeleter<T> = () => Promise<void>;

export interface AthenaAPIClientOptions {
    apiEndpoint: string;

    saveEncryptionKey: DataSaver<string>;
    loadEncryptionKey: DataLoader<string>;
    deleteEncryptionKey: DataDeleter<string>;

    loadAccessToken: DataLoader<string>;
    saveAccessToken: DataSaver<string>;
    deleteAccessToken: DataDeleter<string>;

    loadRefreshToken: DataLoader<string>;
    saveRefreshToken: DataSaver<string>;
    deleteRefreshToken: DataDeleter<string>;

    loadCurrentUser: DataLoader<UserDto>;
    saveCurrentUser: DataSaver<UserDto>;
    deleteCurrentUser: DataDeleter<UserDto>;
}

export class AthenaAPIClient {
    private readonly options: AthenaAPIClientOptions;
    private encryptionKey?: string;
    private accessToken?: string;
    private refreshToken?: string;

    constructor(options: AthenaAPIClientOptions) {
        this.options = options;
    }

    private async query<ResponseType>(options: QueryOptions, repeat = false): Promise<ResponseType> {
        if (!options.noAuthRequired && !this.accessToken) {
            const accessToken = await AthenaAPIClient.loadData(this.options.loadAccessToken);
            const refreshToken = await AthenaAPIClient.loadData(this.options.loadRefreshToken);
            if (refreshToken) {
                this.refreshToken = refreshToken;
            }
            else {
                throw new AthenaNoRefreshTokenError();
            }

            if (accessToken) {
                this.accessToken = accessToken;
            }
            else if (!repeat) {
                return this.refreshAuthAndRetry(options);
            }
            else {
                throw new AthenaNoAccessTokenError();
            }
        }


        let response: any = null;
        try {
            response = await axios({
                ...options,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
        }
        catch (e: any) {
            if (e.response?.data?.identifier === AthenaErrorIdentifiers.ACCESS_UNAUTHORIZED && !repeat) {
                return this.refreshAuthAndRetry<ResponseType>(options);
            }

            throw new AthenaRequestError(
                {
                    message: `There was an error with the request '${options.url} [${options.method}]'`,
                    originalError: e,
                    response: e.response?.data
                }
            );
        }

        return response.data;
    }

    private async refreshAuthAndRetry<ResponseType>(options: QueryOptions): Promise<ResponseType> {
        await this.refresh();
        return this.query(options, true);
    }

    private async checkEncryptionKey() {
        if (!this.encryptionKey) {
            const encryptionKey = await AthenaAPIClient.loadData(this.options.loadEncryptionKey);

            if (encryptionKey) {
                this.encryptionKey = encryptionKey;
                return;
            }

            throw new AthenaNoEncryptionKeyError();
        }
    }

    // Data Loading
    private static async loadData(loader: DataLoader<any>) {
        try {
            return await loader();
        }
        catch (e) {
            throw new AthenaDataLoadError({originalError: e});
        }
    }

    private static async saveData(saver: DataSaver<any>, data: any) {
        try {
            return await saver(data);
        }
        catch (e) {
            throw new AthenaDataSaveError({originalError: e});
        }
    }

    private static async deleteData(deleter: DataDeleter<any>) {
        try {
            return await deleter();
        }
        catch (e) {
            throw new AthenaDataDeleteError({originalError: e});
        }
    }

    // Info
    async getInfo() {
        return this.query<InfoDto>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/info`,
            noAuthRequired: true
        });
    }

    // User
    public async login(username: string, password: string) {
        // Convert plain text password into serverPassword and masterKey
        const accountKeys = AthenaEncryption.getAccountKeys(username, password);

        const data = await this.query<LoginResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/auth/login`,
            data: {
                username,
                password: accountKeys.serverPassword
            },
            noAuthRequired: true
        });

        // Decrypt users encryptionKey with their masterKey
        // todo: don't trust data is encrypted correctly
        const encryptionKey = AthenaEncryption.decryptText(accountKeys.masterKey, data.user.encryptionSecret);
        await AthenaAPIClient.saveData(this.options.saveEncryptionKey, encryptionKey);

        // Save user details and tokens
        await AthenaAPIClient.saveData(this.options.saveCurrentUser, data.user);

        await AthenaAPIClient.saveData(this.options.saveRefreshToken, data.refreshToken);
        this.refreshToken = data.refreshToken;

        await AthenaAPIClient.saveData(this.options.saveAccessToken, data.accessToken);
        this.accessToken = data.accessToken;

        return data;
    }

    public async register(noKeysUser: NoKeysUserDto) {
        // Get user account keys from plain text password and overwrite the user password.
        const accountKeys = AthenaEncryption.getAccountKeys(noKeysUser.username, noKeysUser.password);

        // Generate the user's encryptionSecret
        const encryptionKey = AthenaEncryption.generateEncryptionKey();
        const encryptionSecret = AthenaEncryption.encryptText(accountKeys.masterKey, encryptionKey);

        const user: CreateUserRequest = {
            username: noKeysUser.username,
            email: noKeysUser.email,
            password: accountKeys.serverPassword,
            encryptionSecret
        }

        const data = await this.query<CreateUserResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/users`,
            data: user,
            noAuthRequired: true
        });

        await AthenaAPIClient.saveData(this.options.saveEncryptionKey, encryptionKey);
        await AthenaAPIClient.saveData(this.options.saveCurrentUser, data.user);

        await AthenaAPIClient.saveData(this.options.saveRefreshToken, data.refreshToken);
        this.refreshToken = data.refreshToken;
        await AthenaAPIClient.saveData(this.options.saveAccessToken, data.accessToken);
        this.accessToken = data.accessToken;

        return data;
    }

    public async logout() {
        // todo: loading from external if not found?
        let tokens: any = {};
        if (this.accessToken) {
            tokens.accessToken = this.accessToken;
        }
        if (this.refreshToken) {
            tokens.refreshToken = this.refreshToken;
        }

        await this.query({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/auth/revoke`,
            noAuthRequired: true,
            data: tokens
        });

        // Don't delete storage data until after the request.
        // This ensures that in the event that the revoke request fails there is the option to try
        // again rather than just loosing all the tokens.
        await AthenaAPIClient.deleteData(this.options.deleteCurrentUser);
        await AthenaAPIClient.deleteData(this.options.deleteEncryptionKey);

        await AthenaAPIClient.deleteData(this.options.deleteRefreshToken);
        await AthenaAPIClient.deleteData(this.options.deleteAccessToken);

        delete this.refreshToken;
        delete this.accessToken;
    }

    private async refresh() {
        if (!this.refreshToken) {
            throw new AthenaNoRefreshTokenError();
        }

        let data: RefreshResponse;
        try {
            data = await this.query<RefreshResponse>({
                method: 'POST',
                url: `${this.options.apiEndpoint}/v1/auth/refresh`,
                noAuthRequired: true,
                data: {
                    refreshToken: this.refreshToken
                }
            });
        }
        catch(e) {
            // If the refresh request fails then fully log the user out to be safe
            await this.logout();

            throw e;
        }

        await AthenaAPIClient.saveData(this.options.saveRefreshToken, data.refreshToken);
        this.refreshToken = data.refreshToken;
        await AthenaAPIClient.saveData(this.options.saveAccessToken, data.accessToken);
        this.accessToken = data.accessToken;

        return data;
    }

    // Vault Endpoints
    async createVault(vault: CreateVaultRequest) {
        await this.checkEncryptionKey();
        const encryptedVault = AthenaEncryption.encryptCreateVaultRequest(<string> this.encryptionKey, vault);

        return this.query<CreateNoteResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/vaults`,
            data: encryptedVault
        })
    }

    async getVaults(options?: VaultsQueryParams) {
        await this.checkEncryptionKey();

        const getVaultsResponse = await this.query<GetVaultsResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults`,
            params: options || {}
        })

        const decryptedVaults: VaultDto[] = [];
        for (const vault of getVaultsResponse.vaults) {
            decryptedVaults.push(
              AthenaEncryption.decryptVault(<string> this.encryptionKey, vault)
            )
        }

        return {
            meta: getVaultsResponse.meta,
            vaults: decryptedVaults
        }
    }

    async getVault(vaultId: string) {
        await this.checkEncryptionKey();

        const vault = await this.query<GetVaultResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}`
        });

        return AthenaEncryption.decryptVault(<string> this.encryptionKey, vault);
    }

    async updateVault(vaultId: string, updateVaultRequest: UpdateVaultRequest) {
        await this.checkEncryptionKey();

        const encryptedVaultUpdate = AthenaEncryption.encryptUpdateVaultRequest(<string> this.encryptionKey, updateVaultRequest);

        return this.query<UpdateNoteResponse>({
            method: 'PATCH',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}`,
            data: encryptedVaultUpdate
        })
    }

    async deleteVault(vaultId: string) {
        await this.checkEncryptionKey();

        return this.query({
            method: 'DELETE',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}`
        })
    }

    // Note Endpoints
    async createNote(vaultId: string, note: CreateNoteRequest) {
        await this.checkEncryptionKey();
        const encryptedNote = AthenaEncryption.encryptCreateNoteRequest(<string> this.encryptionKey, note);

        const result = await this.query<CreateNoteResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/notes`,
            data: encryptedNote
        })

        return AthenaEncryption.decryptNote(<string> this.encryptionKey, result);
    }

    async getNotes(vaultId: string, options?: NotesQueryParams) {
        await this.checkEncryptionKey();

        const response = await this.query<GetNotesResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/notes`,
            params: options || {}
        })

        const decryptedNotes: NoteDto[] = [];
        for (const note of response.notes) {
            decryptedNotes.push(
              AthenaEncryption.decryptNote(<string> this.encryptionKey, note)
            )
        }

        return {
            meta: response.meta,
            notes: decryptedNotes
        }
    }

    async getNote(vaultId: string, noteId: string) {
        await this.checkEncryptionKey();

        const response = await this.query<GetNoteResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/notes/${noteId}`
        });

        return AthenaEncryption.decryptNote(<string> this.encryptionKey, response);
    }

    async updateNote(vaultId: string, noteId: string, updateNoteRequest: UpdateNoteRequest) {
        await this.checkEncryptionKey();

        const updateNoteRequestUpdate = AthenaEncryption.encryptUpdateNoteRequest(<string> this.encryptionKey, updateNoteRequest);

        const result = await this.query<UpdateNoteResponse>({
            method: 'PATCH',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/notes/${noteId}`,
            data: updateNoteRequestUpdate
        })

        return AthenaEncryption.decryptNote(<string> this.encryptionKey, result);
    }

    async deleteNote(vaultId: string, noteId: string) {
        await this.checkEncryptionKey();

        return this.query({
            method: 'DELETE',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/notes/${noteId}`
        })
    }

    // Template Endpoints
    async createTemplate(vaultId: string, template: CreateTemplateRequest) {
        await this.checkEncryptionKey();
        const encryptedTemplate = AthenaEncryption.encryptCreateTemplateRequest(<string> this.encryptionKey, template);

        const result = await this.query<CreateTemplateResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/templates`,
            data: encryptedTemplate
        })

        return AthenaEncryption.decryptTemplate(<string> this.encryptionKey, result);
    }

    async getTemplates(vaultId: string, options?: TemplatesQueryParams) {
        await this.checkEncryptionKey();

        const response = await this.query<GetTemplatesResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/templates`,
            params: options || {}
        })

        const decryptedTemplates: TemplateDto[] = [];
        for (const template of response.templates) {
            decryptedTemplates.push(
              AthenaEncryption.decryptTemplate(<string> this.encryptionKey, template)
            )
        }

        return {
            meta: response.meta,
            templates: decryptedTemplates
        }
    }

    async getTemplate(vaultId: string, templateId: string) {
        await this.checkEncryptionKey();

        const response = await this.query<GetTemplateResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/templates/${templateId}`
        });

        return AthenaEncryption.decryptTemplate(<string> this.encryptionKey, response);
    }

    async updateTemplate(vaultId: string, templateId: string, updateTemplateRequest: UpdateTemplateRequest) {
        await this.checkEncryptionKey();

        const updateTemplateRequestUpdate = AthenaEncryption.encryptUpdateTemplateRequest(<string> this.encryptionKey, updateTemplateRequest);

        const result = await this.query<UpdateNoteResponse>({
            method: 'PATCH',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/templates/${templateId}`,
            data: updateTemplateRequestUpdate
        })

        return AthenaEncryption.decryptTemplate(<string> this.encryptionKey, result);
    }

    async deleteTemplate(vaultId: string, templateId: string) {
        await this.checkEncryptionKey();

        return this.query({
            method: 'DELETE',
            url: `${this.options.apiEndpoint}/v1/vaults/${vaultId}/templates/${templateId}`
        })
    }
}
