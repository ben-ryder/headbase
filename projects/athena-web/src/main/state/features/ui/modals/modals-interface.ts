import {ContentData} from "../content/content-selctors";
import {ContentType} from "../content/content-interface";


export interface UIModalsState {
  renameContent: {
    isOpen: boolean,
    content: ContentData | null
  },
  deleteContent: {
    isOpen: boolean,
    content: ContentData | null
  },
  createContent: {
    isOpen: boolean,
    type: ContentType | null
  }
}