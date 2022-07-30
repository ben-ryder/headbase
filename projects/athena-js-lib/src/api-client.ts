import axios from 'axios';

import { AthenaEncryption } from './encryption';
import {
    AthenaNoAccessTokenError,
    AthenaNoEncryptionKeyError,
    AthenaNoRefreshTokenError,
    AthenaRequestError,
    AthenaDataDeleteError,
    AthenaDataLoadError,
    AthenaDataSaveError, AthenaDecryptError
} from './errors';
import {UserDto} from "./schemas/users/dtos/user.dto";
import {LoginResponse} from "./schemas/auth/response/login.auth.response";
import {RefreshResponse} from "./schemas/auth/response/refresh.auth.response";
import {GetNoteResponse} from "./schemas/notes/response/get.note.response";
import {GetNotesResponse} from "./schemas/notes/response/get.notes.response";
import {NoteDto} from "./schemas/notes/dtos/note.dto";
import {CreateNoteResponse} from "./schemas/notes/response/create.notes.response";
import {UpdateNoteResponse} from "./schemas/notes/response/update.notes.response";
import {CreateNoteRequest} from "./schemas/notes/request/create.notes.request";
import {CreateUserRequest} from "./schemas/users/request/create.users.request";


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

    encryptionKey?: string | null;
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
            if (e.response?.status === 401 && !repeat) {
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
        if (!this.options.encryptionKey) {
            const encryptionKey = await AthenaAPIClient.loadData(this.options.loadEncryptionKey);

            if (encryptionKey) {
                this.options.encryptionKey = encryptionKey;
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

    // User
    public async login(username: string, password: string) {
        const data = await this.query<LoginResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/auth/login`,
            data: {
                username,
                password
            },
            noAuthRequired: true
        });

        await AthenaAPIClient.saveData(this.options.saveCurrentUser, data.user);

        await AthenaAPIClient.saveData(this.options.saveRefreshToken, data.refreshToken);
        this.refreshToken = data.refreshToken;
        await AthenaAPIClient.saveData(this.options.saveAccessToken, data.accessToken);
        this.accessToken = data.accessToken;

        return data;
    }

    public async register(user: CreateUserRequest) {
        return this.query<UserDto>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/users`,
            data: user,
            noAuthRequired: true
        });
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

        await AthenaAPIClient.deleteData(this.options.deleteCurrentUser);
        await AthenaAPIClient.deleteData(this.options.deleteEncryptionKey);

        await AthenaAPIClient.deleteData(this.options.deleteRefreshToken);
        delete this.refreshToken;
        await AthenaAPIClient.deleteData(this.options.deleteAccessToken);
        delete this.accessToken;
    }

    private async refresh() {
        if (!this.refreshToken) {
            throw new AthenaNoRefreshTokenError();
        }

        const tokens = await this.query<RefreshResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/v1/auth/refresh`,
            noAuthRequired: true
        });

        await AthenaAPIClient.saveData(this.options.saveRefreshToken, tokens.refreshToken);
        this.refreshToken = tokens.refreshToken;
        await AthenaAPIClient.saveData(this.options.saveAccessToken, tokens.accessToken);
        this.accessToken = tokens.accessToken;
    }

    // Note Listing Endpoints
    private async getEncryptedNotes(): Promise<GetNotesResponse> {
        return this.query<GetNotesResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/notes/v1`
        });
    }

    async getNotes(): Promise<GetNotesResponse> {
        await this.checkEncryptionKey();

        const encryptedNotesResponse = await this.getEncryptedNotes();
        let notes: NoteDto[] = [];
        for (let note of encryptedNotesResponse.notes) {
            notes.push(
              AthenaEncryption.decryptNote(<string> this.options.encryptionKey, note)
            )
        }

        return {
            notes,
            meta: encryptedNotesResponse.meta
        };
    }

    // Note Endpoints
    async createNote(newNote: CreateNoteRequest) {
        await this.checkEncryptionKey();

        const encryptedNote = AthenaEncryption.encryptNoteContent(<string> this.options.encryptionKey, newNote);

        return this.query<CreateNoteResponse>({
            method: 'POST',
            url: `${this.options.apiEndpoint}/notes/v1`,
            data: encryptedNote
        })
    }

    private async getEncryptedNote(noteId: string): Promise<GetNoteResponse> {
        return this.query<GetNoteResponse>({
            method: 'GET',
            url: `${this.options.apiEndpoint}/v1/notes/${noteId}`
        })
    }

    async getNote(noteId: string): Promise<GetNoteResponse> {
        await this.checkEncryptionKey();

        const encryptedNote = await this.getEncryptedNote(noteId);
        return AthenaEncryption.decryptNote(<string> this.options.encryptionKey, encryptedNote);
    }

    async updateNote(noteId: string, note: NoteDto) {
        await this.checkEncryptionKey();

        const encryptedNoteUpdate = await AthenaEncryption.encryptNote(<string> this.options.encryptionKey, note);
        return this.query<UpdateNoteResponse>({
            method: 'PATCH',
            url: `${this.options.apiEndpoint}/v1/notes/${noteId}`,
            data: encryptedNoteUpdate
        })
    }

    async deleteNote(noteId: string) {
        return this.query({
            method: 'DELETE',
            url: `${this.options.apiEndpoint}/v1/notes/${noteId}`
        })
    }
}
