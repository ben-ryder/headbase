import {z} from "zod";
import {FIELDS} from "../types.ts";
import {BaseFieldData} from "./base.ts";

export const _SelectSettings = z.object({
	options: z.array(z.object({
		label: z.string(),
		value: z.string(),
		colour: z.string().optional(),
	}))
}).strict()

export const SelectFieldData = BaseFieldData.extend({
	type: z.literal(FIELDS.selectOne.id),
	settings: _SelectSettings
}).strict()
export type SelectFieldData = z.infer<typeof SelectFieldData>

export const SelectValue = z.string()
export type SelectValue = z.infer<typeof SelectValue>


export const SelectMultipleFieldData = BaseFieldData.extend({
	type: z.literal(FIELDS.selectMany.id),
	settings: _SelectSettings
}).strict()
export type SelectMultipleFieldData = z.infer<typeof SelectMultipleFieldData>

export const SelectMultipleValue = z.array(z.string())
export type SelectMultipleValue = z.infer<typeof SelectValue>
