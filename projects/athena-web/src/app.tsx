import React, {useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tailwind.css';

import { HomePage } from './pages/home';
import {AthenaRestrictedRoute} from "./helpers/athena-restricted-route";
import {PageNotFound} from "./pages/page-not-found";
import {LogoutPage} from "./pages/user/logout";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {LoginPage} from "./pages/user/login";
import {MainPage} from "./pages/main/main";
import {ForgottenPasswordPage} from "./pages/user/password/forgotten-password";
import {routes} from "./routes";
import {ResetPasswordPage} from "./pages/user/password/reset-password";
import {RegisterPage} from "./pages/user/register/register";
import {
  AthenaContext,
  athenaStorageInstance,
  athenaAPIClientInstance,
  CurrentUserContext,
  useAthena
} from "./helpers/use-athena";
import {AthenaSessionManager} from "./helpers/athena-session-manager";
import {UserSettingsPage} from "./pages/user/settings";
import {RequestVerificationPage} from "./pages/user/verify/request-verification";
import {SubmitVerificationPage} from "./pages/user/verify/submit-verification";
import {ListVaultsPage} from "./pages/vaults/list-vaults";
import {CreateVaultPage} from "./pages/vaults/create-vault";
import {EditVaultPage} from "./pages/vaults/edit-vault";
import {DeleteVaultPage} from "./pages/vaults/delete-vault";


export function App() {
  const { storage } = useAthena();
  const [currentUser, setCurrentUser] = useState<CurrentUserContext>(null);

  async function processSetCurrentUser(user: CurrentUserContext) {
    if (user) {
      await storage.saveCurrentUser(user);
    }
    else {
      await storage.deleteCurrentUser();
    }

    setCurrentUser(user);
  }

  return (
    <AthenaContext.Provider value={{
      apiClient: athenaAPIClientInstance,
      storage: athenaStorageInstance,
      currentUser,
      setCurrentUser: processSetCurrentUser
    }}>
      <HelmetProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Athena</title>
        </Helmet>
        <AthenaSessionManager>
          <BrowserRouter>
            <Routes>
              {/* Home Route */}
              <Route path={routes.home} element={<HomePage />} />

              {/* Public User Routes */}
              <Route path={routes.users.login} element={<LoginPage />} />
              <Route path={routes.users.register} element={<RegisterPage />} />
              <Route path={routes.users.logout} element={<LogoutPage />} />

              <Route path={routes.users.password.forgotten} element={<ForgottenPasswordPage />} />
              <Route path={routes.users.password.reset} element={<ResetPasswordPage />} />

              <Route path={routes.users.verification.request} element={<RequestVerificationPage />} />
              <Route path={routes.users.verification.submit} element={<SubmitVerificationPage />} />

              {/* Restricted Routes (requiring valid user login) */}
              <Route element={<AthenaRestrictedRoute />} >

                {/* Private User Routes */}
                <Route path={routes.users.settings} element={<UserSettingsPage />} />

                {/* Vaults Routes */}
                <Route path={routes.vaults.list} element={<ListVaultsPage />} />
                <Route path={routes.vaults.create} element={<CreateVaultPage />} />
                <Route path={routes.vaults.edit} element={<EditVaultPage />} />
                <Route path={routes.vaults.delete} element={<DeleteVaultPage />} />

                <Route path={routes.app.main} element={<MainPage />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </BrowserRouter>
        </AthenaSessionManager>
      </HelmetProvider>
    </AthenaContext.Provider>
  );
}
