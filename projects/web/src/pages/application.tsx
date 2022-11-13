import React, {useEffect, useState} from 'react';
import {Helmet} from "react-helmet-async";
import classNames from "classnames";
import {StrictReactNode} from "@ben-ryder/jigsaw";
import {useLogto} from "@logto/react";
import {routes} from "../routes";

export interface ApplicationProps {
  children: StrictReactNode
}

export function Application(props: ApplicationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

  return (
    <>
      <Helmet>
        <title>{`Application | Athena`}</title>
      </Helmet>

      {/** The main container, makes the app always fill the window **/}
      <main className="h-[100vh] w-[100vw] md:flex">

        {/** SECTION - Side Panel **/}
        <div className={classNames(
          "bg-br-atom-800 z-10 w-full absolute flex flex-col justify-between",
          "md:h-[100vh] md:w-[300px] md:relative md:border-r md:border-br-blueGrey-700"
        )}
        >

          {/** Top Menu **/}
          <div className="bg-br-atom-900 w-full h-[50px]">
            <p>Athena</p>
            <button className="md:hidden" onClick={() => {setIsMenuOpen(!isMenuOpen)}}>{isMenuOpen ? "close menu" : "open menu"}</button>
          </div>

          {/** Menu Content **/}
          <div
            className={classNames(
              "flex flex-col justify-between",
              {
                "": isMenuOpen,
                "hidden": !isMenuOpen
              }
            )}
          >
            {/** Account Menu **/}
            <div className="bg-br-atom-900 w-full h-[50px]">
              <AccountMenu />
            </div>
          </div>
        </div>

        {/** SECTION - Main Area **/}
        <div className="bg-br-atom-700 w-[100vw] h-[100vh] md:w-[calc(100vw-300px)]">
          {props.children}
        </div>
      </main>
    </>
  )
}

export function AccountMenu() {
  const [username, setUsername] = useState<string|null>(null);
  const { signIn, isAuthenticated, signOut, getIdTokenClaims } = useLogto();

  useEffect(() => {
    async function getUsername() {
      if (isAuthenticated) {
        const claims = await getIdTokenClaims();
        const name = claims?.name || claims?.username || null;
        console.log(claims);
        setUsername(name);
      }
    }
    getUsername();
  }, [isAuthenticated, getIdTokenClaims])

  if (isAuthenticated) {

    return (
      <>
        <p className="text-br-whiteGrey-100">{username ? username : "Signed In"}</p>
        <button className="text-br-whiteGrey-100" onClick={() => signOut(window.location.origin)}>
          Sign out
        </button>
      </>
    );
  }

  return (
    <button className="text-br-whiteGrey-100" onClick={() => signIn(window.location.origin + routes.user.callback)}>
      Sign In
    </button>
  );
}
