import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { VaultDatabase } from "../state/application-state";
import { initialDatabase } from "../state/database/initial-database";
import * as A from "@automerge/automerge";
import { UserDto } from "@ben-ryder/lfb-common";
import {
  EncryptionHelper,
  LFBApplication,
  LFBClient,
  LocalStore,
} from "@ben-ryder/lfb-toolkit";
import { LoadingScreen } from "../patterns/components/loading-screen/loading-screen";

const SERVER_URL = import.meta.env.VITE_LFB_SERVER_URL;

const localStore = new LocalStore();
const lfbClient = new LFBClient({
  serverUrl: SERVER_URL,
  localStore: localStore,
});
export const lfbApplication = new LFBApplication<VaultDatabase>(initialDatabase, {
  localStore: localStore,
  lfbClient: lfbClient,
});

// This gives a final resort escape hatch for fixing corrupt data as you can
// easily view the current document and make direct .makeChange calls directly
// from the browser console.
// @todo: consider if this has any security concerns? I don't think so, but worth a think
if (typeof document !== 'undefined') {
  // @ts-ignore
  document.lfbApplication = lfbApplication
}

export interface LFBContext {
  loading: boolean;
  document: VaultDatabase;
  makeChange: (changeFunc: A.ChangeFn<VaultDatabase>) => void;
  currentUser: UserDto | null;
  online: boolean;
  setOnline: (online: boolean) => void;
  lfbClient: LFBClient;
}

export const LFBContext = createContext<LFBContext>({
  loading: true,
  document: initialDatabase,
  makeChange: () => {},
  currentUser: null,
  online: true,
  setOnline: (online: boolean) => {},
  lfbClient: lfbClient,
});

export interface ApplicationProviderProps {
  children: ReactNode;
}

export function LFBProvider(props: ApplicationProviderProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [document, setDocument] =
    useState<A.Doc<VaultDatabase>>(initialDatabase);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [online, setOnline] = useState<boolean>(true);

  // Hook to do the initial setup and loading
  useEffect(() => {
    async function init() {
      lfbApplication.addUpdateListener((updatedDoc) => {
        // @ts-ignore
        setDocument(updatedDoc);
      });

      let encryptionKey = await localStore.loadEncryptionKey();
      if (!encryptionKey) {
        /**
         * In order to use the application an encryption key must be present.
         * If there is not one present, randomly generate one.
         *
         * todo: replace with error handling once user system and sync is in place.
         */
        const randomEncryptionKey = EncryptionHelper.generateEncryptionKey();
        await localStore.saveEncryptionKey(randomEncryptionKey);
      }

      let currentUser = await localStore.loadCurrentUser();
      setCurrentUser(currentUser);

      await lfbApplication.load();
      setLoading(false);
    }
    init();
  }, [lfbApplication]);

  return (
    <LFBContext.Provider
      value={{
        loading,
        document,
        makeChange: lfbApplication.makeChange.bind(lfbApplication),
        currentUser,
        online,
        setOnline,
        lfbClient: lfbClient,
      }}
    >
      {loading
        ? <LoadingScreen />
        : props.children}
    </LFBContext.Provider>
  );
}

export const useLFBApplication = () => useContext(LFBContext);
