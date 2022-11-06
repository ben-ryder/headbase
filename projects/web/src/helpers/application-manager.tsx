import {useApplication} from "./application-context";
import {useEffect, useState} from 'react';
import {StrictReactNode} from "../types/strict-react-node";
import {initialDocument} from "../state/features/database/initial-document";
import {Document} from "../state/features/database/athena-database";

export interface AthenaSessionManagerProps {
  children: StrictReactNode
}

/**
 * A wrapper for managing the application.
 * @constructor
 */
export function ApplicationManager(props: AthenaSessionManagerProps) {
  let { application } = useApplication();
  let [document, setDocument] = useState<Document>(initialDocument);

  useEffect(() => {
    async function init() {
      await application.init();
      application.addUpdateListener(setDocument);
    }
  }, [application]);

  return (
      <>{props.children}</>
  )
}
