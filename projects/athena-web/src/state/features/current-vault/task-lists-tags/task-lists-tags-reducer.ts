import {createReducer} from "@reduxjs/toolkit";
import {v4 as createUUID} from "uuid";
import {deleteTaskList, updateTaskListTags} from "../task-lists/task-lists-actions";
import {TaskListsTagsState} from "./task-list-tags-interface";

export const initialTaskListsTags: TaskListsTagsState = {
  entities: {},
  ids: []
};

export const taskListsTagsReducer = createReducer(
  initialTaskListsTags,
  (builder) => {
    builder.addCase(updateTaskListTags, (state, action) => {
      const existingTags = state.ids.filter(taskListTagId => {
        return state.entities[taskListTagId].taskListId === action.payload.id
      })

      // Remove existing tags
      state.ids = state.ids.filter(taskListTagId => !existingTags.includes(taskListTagId));
      for (const taskListTagId of existingTags) {
        delete state.entities[taskListTagId];
      }

      // Add new tags
      for (const tagId of action.payload.tags) {
        const id = createUUID();
        state.ids.push(id);
        state.entities[id] = {
          id: id,
          taskListId: action.payload.id,
          tagId: tagId
        }
      }
    })

    builder.addCase(deleteTaskList, (state, action) => {
      state.ids = state.ids.filter(id => {
        const entity = state.entities[id];

        if (entity.taskListId === action.payload) {
          delete state.entities[id];
          return false;
        }
        return true;
      })
    })
  }
);
