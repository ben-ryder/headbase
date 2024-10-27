import React, { useState } from "react";
import { ErrorCallout } from "../../../../patterns/components/error-callout/error-callout";
import { TagData } from "../../../../state/schemas/tags/tags";
import {ErrorTypes} from "@headbase-toolkit/control-flow";
import {
	GenericManagerScreenProps
} from "../../../../common/generic-manager/generic-manager";
import { TagForm } from "../forms/tag-form";
import {HeadbaseTableSchemas, HeadbaseTableTypes} from "../../../../state/headbase";
import {useHeadbase} from "@headbase-toolkit/react/use-headbase";

export function CreateTagScreen(props: GenericManagerScreenProps) {
	const {currentDatabaseId, headbase} = useHeadbase<HeadbaseTableTypes, HeadbaseTableSchemas>()
	const [errors, setErrors] = useState<unknown[]>([])

	async function onSave(data: TagData) {
		if (!currentDatabaseId || !headbase) return setErrors([{type: ErrorTypes.NO_CURRENT_DATABASE}])

		try {
			await headbase.tx.create(currentDatabaseId, 'tags', data)
			props.navigate({screen: "list"})
		}
		catch (e) {
			console.debug(e)
			setErrors([e])
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