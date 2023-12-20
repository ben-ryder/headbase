import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider as ReduxProvider } from "react-redux";

import "./athena.scss";
import { routes } from "./routes";
import { LFBProvider } from "./utils/lfb-context";
import { store } from "./state/redux";

import { GlobalLayout } from "./patterns/layout/global-layout/global-layout";

import { HomePage } from "./pages/home";
import { PageNotFound } from "./pages/page-not-found";
import { ItemsPage } from "./pages/items/items-page";
import { CreateItemPage } from "./pages/items/create-item-page";
import { EditItemPage } from "./pages/items/edit-item-page";
import { WelcomePage } from "./pages/welcome";
import { MenuPage } from "./pages/menu";
import { TagsPage } from "./pages/tags/tags-page";
import { CreateTagPage } from "./pages/tags/create-tag-page";
import { EditTagPage } from "./pages/tags/edit-tag-page";
import { AttachmentsManagerPage } from "./pages/attachments/attachments-manager";

export function App() {
  return (
    <ReduxProvider store={store}>
      <BrowserRouter>
        <LFBProvider>
          <HelmetProvider>
            <Helmet>
              <meta charSet="utf-8" />
              <title>Athena</title>
            </Helmet>
            <GlobalLayout>
              <Routes>
                {/* Basic Pages */}
                <Route path={routes.home} element={<HomePage />} />
                <Route path={routes.welcome} element={<WelcomePage />} />
                <Route path={routes.menu} element={<MenuPage />} />

                {/* Item Routes */}
                <Route
                  path={routes.items.list}
                  element={<ItemsPage />}
                />
                <Route
                  path={routes.items.create}
                  element={<CreateItemPage />}
                />
                <Route
                  path={routes.items.edit}
                  element={<EditItemPage />}
                />

                {/* Tags Routes */}
                <Route
                  path={routes.tags.list}
                  element={<TagsPage />}
                />
                <Route
                  path={routes.tags.create}
                  element={<CreateTagPage />}
                />
                <Route
                  path={routes.tags.edit}
                  element={<EditTagPage />}
                />

                <Route
                  path={routes.attachments}
                  element={<AttachmentsManagerPage />}
                />

                {/* 404 Route */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </GlobalLayout>
          </HelmetProvider>
        </LFBProvider>
      </BrowserRouter>
    </ReduxProvider>
  );
}
