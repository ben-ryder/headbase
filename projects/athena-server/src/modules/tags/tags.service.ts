import {AccessForbiddenError, Injectable} from "@kangojs/core";
import {TagsDatabaseService} from "./database/tags.database.service";
import {DatabaseListOptions} from "../../common/database-list-options";
import {
  CreateTagRequest,
  DefaultVaultsListOptions, GetTagResponse,
  GetTagsResponse,
  TagDto,
  TagsQueryParams,
  UpdateTagRequest
} from "@ben-ryder/athena-js-lib";


@Injectable({
  identifier: "tags-service"
})
export class TagsService {
  constructor(
    private tagsDatabaseService: TagsDatabaseService
  ) {}

  async checkAccess(requestUserId: string, tagId: string): Promise<void> {
    const tag = await this.tagsDatabaseService.getWithOwner(tagId);

    if (tag.owner === requestUserId) {
      return;
    }

    throw new AccessForbiddenError({
      message: "Access forbidden to tag"
    })
  }

  async get(tagId: string): Promise<GetTagResponse> {
    return await this.tagsDatabaseService.get(tagId);
  }

  async getWithAccessCheck(requestUserId: string, tagId: string): Promise<GetTagResponse> {
    await this.checkAccess(requestUserId, tagId);
    return this.get(tagId);
  }

  async add(ownerId: string, createTagDto: CreateTagRequest): Promise<TagDto> {
    return await this.tagsDatabaseService.create(ownerId, createTagDto);
  }

  async update(tagId: string, tagUpdate: UpdateTagRequest): Promise<TagDto> {
    return await this.tagsDatabaseService.update(tagId, tagUpdate)
  }

  async updateWithAccessCheck(requestUserId: string, tagId: string, tagUpdate: UpdateTagRequest): Promise<TagDto> {
    await this.checkAccess(requestUserId, tagId);
    return this.update(tagId, tagUpdate);
  }

  async delete(tagId: string): Promise<void> {
    return this.tagsDatabaseService.delete(tagId);
  }

  async deleteWithAccessCheck(requestUserId: string, tagId: string): Promise<void> {
    await this.checkAccess(requestUserId, tagId);
    return this.delete(tagId);
  }

  async listWithAccessCheck(ownerId: string, tagId: string, options: TagsQueryParams): Promise<GetTagsResponse> {
    const processedOptions: DatabaseListOptions = {
      skip: options.skip || DefaultVaultsListOptions.skip,
      take: options.take || DefaultVaultsListOptions.take,
      orderBy: options.orderBy || DefaultVaultsListOptions.orderBy,
      orderDirection: options.orderDirection || DefaultVaultsListOptions.orderDirection
    };

    const tags = await this.tagsDatabaseService.list(ownerId, processedOptions);
    const meta = await this.tagsDatabaseService.getListMetadata(ownerId, processedOptions);

    return {
      tags,
      meta
    }
  }
}