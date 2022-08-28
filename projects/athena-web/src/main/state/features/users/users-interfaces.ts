import {BaseEntity} from "../../common/base-entity";

export interface User extends BaseEntity {
  username: string
}

export interface UsersState {
  entities: {
    [key: string]: User
  },
  ids: string[]
}