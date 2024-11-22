import {sqliteTable, text} from "drizzle-orm/sqlite-core";
import {BaseCreateDto, BaseEntityDto, BaseVersionDto, commonEntityFields, commonFields, commonVersionFields} from "../../common.ts";
import {FieldStorage} from "../fields/field-storage.ts";

export const contentItems = sqliteTable('content_items', {
	...commonFields,
	...commonEntityFields,
});

export const contentItemsVersions = sqliteTable('content_items_versions', {
	...commonFields,
	...commonVersionFields,
	name: text().notNull(),
	icon: text(),
	fields: text({ mode: 'json' }),
});

export type CreateContentItemDto = BaseCreateDto & {
	name: string,
	icon: string | null,
	fields: FieldStorage
}

export type UpdateContentItemDto = CreateContentItemDto

export type ContentItemDto = BaseEntityDto & {
	name: string,
	icon:  string | null,
	fields: FieldStorage
}

export type ContentItemVersionDto = BaseVersionDto & {
	name: string,
	icon:  string | null,
	fields: FieldStorage
}
