import {iconColorClassNames, iconSizes} from "@ben-ryder/jigsaw";
import {Plus as AddContentIcon} from "lucide-react";
import React from "react";
import {useAppDispatch} from "../../../main/state/store";
import {IconWithMenuPopup} from "./icon-with-menu-popup";
import {openCreateContentModal} from "../../../main/state/features/ui/modals/modals-actions";
import {ContentType} from "../../../main/state/features/ui/content/content-interface";

export function CreateContentIconAndPopup() {
  const dispatch = useAppDispatch();

  return (
    <IconWithMenuPopup
      label="Create Content"
      icon={
        <AddContentIcon size={iconSizes.extraSmall} className={iconColorClassNames.secondary} />
      }
      menuItems={[
        {
          label: "Note",
          action: () => {
            dispatch(openCreateContentModal(ContentType.NOTE));
          }
        },
        {
          label: "Template",
          action: () => {
            dispatch(openCreateContentModal(ContentType.TEMPLATE));
          }
        },
        {
          label: "Task List",
          action: () => {
            dispatch(openCreateContentModal(ContentType.TASK_LIST));
          }
        }
      ]}
    />
  )
}
