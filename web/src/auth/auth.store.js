import createStore from "zustand";

import { loginFB, onAuthStateChanged } from "../utils/firebase.util";

const [useAuthStore, AuthAPI] = createStore((setState, getState) => {
  async function login() {
    let user = await loginFB();
    setState({ user, isAuthenticated: true });
  }

  async function checkLoggedIn() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged((user) => {
        if (user) {
          setState({ user, isAuthenticated: true });
          resolve(user);
        } else {
          setState({ isAuthenticated: false });
          reject();
        }
      });
    });
  }

  return {
    isAuthenticated: false,
    user: {},
    login,
    checkLoggedIn,
  };
});
export { useAuthStore, AuthAPI };
