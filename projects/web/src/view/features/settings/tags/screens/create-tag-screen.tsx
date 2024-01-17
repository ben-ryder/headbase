import React, { useState } from "react";
import { ErrorCallout } from "../../../../patterns/components/error-callout/error-callout";
import { TagData } from "../../../../../state/schemas/tags/tags";
import { ErrorObject } from "../../../../../state/control-flow";
import { db } from "../../../../../state/storage/database";
import {
  ContentManagerScreenProps
} from "../../../../common/content-manager/content-manager";
import { TagForm } from "../forms/tag-form";

export function CreateTagScreen(props: ContentManagerScreenProps) {
  const [errors, setErrors] = useState<ErrorObject[]>([])

  async function onSave(data: TagData) {
    const res = await db.tagQueries.create(data)
    if (!res.success) {
      setErrors(res.errors)
    }
    else {
      props.navigate({screen: "list"})
    }
  }

  return (
    <>
      {errors.length > 0 && <ErrorCallout errors={errors} />}
      <TagForm
        title="Create Tag"
        data={{ name: "", colourVariant: undefined }}
        onSave={onSave}
        navigate={props.navigate}
      />
    </>
  );
}