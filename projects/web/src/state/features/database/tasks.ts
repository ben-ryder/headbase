import { Entity, EntityTable } from "./entity";
import { OrderByFields, OrderDirection } from "../../common/lists";

/**
 * Tasks
 */
export interface TaskContent {
  name: string;
  tags: string[];
}
export interface TaskEntity extends Entity, TaskContent {}
export type TasksTable = EntityTable<TaskEntity>;

/**
 * Task Lists
 */
export interface TaskListContent {
  name: string
  tags: string[]
  orderBy: OrderByFields;
  orderDirection: OrderDirection;
}
export interface TaskListEntity extends Entity, TaskListContent {}
export type TaskListsTable = EntityTable<TaskListEntity>;
