export const routes = {
  home: "/",
  users: {
    login: "/user/login",
    register: "/user/register",
    password: {
      forgotten: "/user/forgotten-password",
      reset: "/user/reset-password"
    },
    verification: {
      request: "/user/verify",
      submit: "/user/verify/submit"
    },
    logout: "/user/logout",
    settings: "/user/settings"
  },
  app:  {
    main: "/app"
  },
  external: {
    github: "https://github.com/Ben-Ryder/athena",
    creator: "https://www.benryder.me"
  }
}