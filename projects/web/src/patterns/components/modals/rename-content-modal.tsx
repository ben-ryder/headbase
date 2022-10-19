import {useSelector} from "react-redux";
import {selectRenameContentModal} from "../../../state/features/ui/modals/modals-selectors";
import {useAppDispatch} from "../../../state/store";
import {closeRenameContentModal} from "../../../state/features/ui/modals/modals-actions";
import {Button, Input} from "@ben-ryder/jigsaw";
import {useEffect, useRef, useState} from "react";
import {ContentType} from "../../../state/features/ui/content/content-interface";
import {Modal} from "./modal";
import {renameNote} from "../../../state/features/current-vault/notes/notes-thunks";
import {renameNoteTemplate} from "../../../state/features/current-vault/note-templates/note-templates-thunks";
import {renameTaskList} from "../../../state/features/current-vault/task-lists/task-lists-thunks";


export function RenameContentModal() {
  const dispatch = useAppDispatch();
  const renameModal = useSelector(selectRenameContentModal);
  const closeModal = () => {dispatch(closeRenameContentModal())};

  const [newName, setNewName] = useState<string>("");
  const ref = useRef<HTMLInputElement>(null);

  let contentType;
  switch (renameModal.content?.type) {
    case ContentType.TASK_LIST: {
      contentType = "task list"
      break;
    }
    case ContentType.NOTE_TEMPLATE: {
      contentType = "note template"
      break ;
    }
    default: {
      contentType = "note"
      break;
    }
  }

  useEffect(() => {
    setNewName(renameModal.content?.data.name || "");

    // todo: fix/refine the select functionality to work better, it's not that reliable.
    // maybe this could mean rendering the modal "in line" when required, rather than all the time? That could then also
    // fix the tab order getting borked.

    // A bit of a hack to get the input text to stay selected after the newName state is updated.
    setTimeout(() => {
      if (ref.current) {
        ref.current.select()
      }
    }, 5);
  }, [renameModal]);

  if (!renameModal.content) {
    return null;
  }

  return (
    <Modal
      heading={`Rename '${renameModal.content.data.name}' ${contentType}`}
      isOpen={renameModal.isOpen}
      onClose={closeModal}
      content={
        <form
          onSubmit={() => {
            if (renameModal.content?.type === ContentType.NOTE) {
              dispatch(renameNote(renameModal.content.data.id, newName));
            }
            else if (renameModal.content?.type === ContentType.NOTE_TEMPLATE) {
              dispatch(renameNoteTemplate(renameModal.content.data.id, newName));
            }
            else if (renameModal.content?.type === ContentType.TASK_LIST) {
              dispatch(renameTaskList(renameModal.content.data.id, newName));
            }
            closeModal();
          }}
        >
          <Input
            ref={ref}
            value={newName} onChange={(e) => {setNewName(e.target.value)}}
            id="new-name" label="New Name" type="text"
            onFocus={(e) => {
              // Automatically select all text on focus. This makes it quicker to fully override the name
              // while still allowing quick edits of the existing name if required.
              e.target.select()
            }}
          />

          <div className="mt-4 flex justify-end items-center">
            <Button styling="secondary" onClick={closeModal} type="button">Cancel</Button>
            <Button className="ml-2" type="submit">Save</Button>
          </div>
        </form>
      }
    />
  )
}