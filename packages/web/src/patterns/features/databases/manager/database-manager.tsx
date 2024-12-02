import React, {PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState} from "react";
import {JDialog} from "@ben-ryder/jigsaw-react";
import {DatabaseListScreen} from "../screens/database-list";
import {DatabaseCreateScreen} from "../screens/database-create";
import { DatabaseEditScreen } from "../screens/database-edit";
import {DatabaseUnlockScreen} from "../screens/database-unlock";
import {_DatabaseDialogContext, DatabaseManagerTabs, useDatabaseManagerDialogContext} from "./database-manager-context";
import {useWorkspaceContext} from "../../workspace/workspace-context";
import {DatabaseChangePasswordScreen} from "../screens/database-change-password";
import {useHeadbase} from "../../../../logic/react/use-headbase.tsx";

export function DatabaseManagerDialogProvider(props: PropsWithChildren) {
	const [openTab, _setOpenTab] = useState<DatabaseManagerTabs|undefined>(undefined)

	const setOpenTab = useCallback((tab?: DatabaseManagerTabs) => {
		_setOpenTab(tab ?? {type: 'list'})
	}, [])

	const close = useCallback(() => {
		_setOpenTab(undefined)
	}, [])

	return (
		<_DatabaseDialogContext.Provider
			value={{
				openTab: openTab,
				setOpenTab,
				close
			}}
		>
			{props.children}
		</_DatabaseDialogContext.Provider>
	)
}


export function DatabaseManagerDialog() {
	const { openTab, setOpenTab, close } = useDatabaseManagerDialogContext()
	const { closeAllTabs } = useWorkspaceContext()

	const { currentDatabaseId, setCurrentDatabaseId, headbase } = useHeadbase()

	let dialogContent: ReactNode
	switch (openTab?.type) {
		case "list": {
			dialogContent = <DatabaseListScreen />
			break;
		}
		case "create": {
			dialogContent = <DatabaseCreateScreen />
			break;
		}
		case "edit": {
			dialogContent = <DatabaseEditScreen databaseId={openTab.databaseId} />
			break;
		}
		case "change-password": {
			dialogContent = <DatabaseChangePasswordScreen databaseId={openTab.databaseId} />
			break;
		}
		case "unlock": {
			dialogContent = <DatabaseUnlockScreen databaseId={openTab.databaseId} />
			break;
		}
		default: (
			dialogContent = <p>No Open Tab</p>
		)
	}

	// Keep the database manager open if there is no current database
	const isFirstOpen = useRef(true)
	useEffect(() => {
		async function handleDatabaseChange() {
			if (!headbase) return

			if (currentDatabaseId) {
				localStorage.setItem('lf_lastOpenedDb', currentDatabaseId)
				// todo: should this be managed in workspace not here?
				closeAllTabs()
				close()
			}
			else if (isFirstOpen.current) {
				isFirstOpen.current = false

				const lastOpenedDatabaseId = localStorage.getItem('lf_lastOpenedDb')
				if (lastOpenedDatabaseId) {
					try {
						// ensure the database exists and is unlocked before opening
						const database = await headbase.databases.get(lastOpenedDatabaseId)
						if (database.isUnlocked) {
							setCurrentDatabaseId(lastOpenedDatabaseId)
						}
					}
					catch (e) {
						console.error('Error attempting to open last opened database')
						console.error(e)
					}
				}
				setOpenTab({type: 'list'})
			}
		}
		handleDatabaseChange()
	}, [headbase, currentDatabaseId])

	return (
		<JDialog
			isOpen={!!openTab}
			setIsOpen={(isOpen) => {
				if (isOpen) {
					setOpenTab(isOpen ? {type: 'list'} : undefined)
				}
				else {
					close()
				}
			}}
			role={openTab ? 'dialog' : 'alertdialog'}
			disableOutsideClose={!currentDatabaseId}
			title="Manage databases"
			description="Manage your current database"
			content={dialogContent}
		/>
	)
}
