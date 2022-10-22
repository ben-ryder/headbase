import {v4 as createUUID} from "uuid";
import {AppThunk} from "../../../store";
import {DatabaseTaskList} from "../document-interface";
import {updateDocument} from "../document-reducer";
import {createTaskListChange, deleteTaskListChange, updateTaskListChange} from "./task-list-changes";
import {deleteTaskListTasksChange} from "./tasks/task-changes";
import {updateTaskListTagsChange} from "../task-list-tags/task-list-tags-changes";

export function createNewTaskList(name: string, folderId: string | null): AppThunk {
  return (dispatch, getState) => {
    const state = getState();

    const timestamp = new Date().toISOString();
    const taskList = {
      name: name,
      folderId: folderId,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    const updatedDoc = createTaskListChange(state.document, taskList);
    dispatch(updateDocument(updatedDoc));
  }
}

export function renameTaskList(taskListId: string, newName: string): AppThunk {
  return (dispatch, getState) => {
    const state = getState();

    const timestamp = new Date().toISOString();

    const updatedDoc = updateTaskListChange(state.document, taskListId, {updatedAt: timestamp, name: newName});
    dispatch(updateDocument(updatedDoc));
  }
}

export function moveTaskList(taskListId: string, newFolder: string | null): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const timestamp = new Date().toISOString();

    const updatedDoc = updateTaskListChange(state.document, taskListId, {updatedAt: timestamp, folderId: newFolder});
    dispatch(updateDocument(updatedDoc));
  }
}

export function updateTaskListTags(taskListId: string, tags: string[]): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const updatedDoc = updateTaskListTagsChange(state.document, taskListId, tags);
    dispatch(updateDocument(updatedDoc));
  }
}

export function deleteTaskList(taskListId: string): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    let updatedDoc = deleteTaskListChange(state.document, taskListId);
    updatedDoc = deleteTaskListTasksChange(updatedDoc, taskListId);
    dispatch(updateDocument(updatedDoc));
  }
}
