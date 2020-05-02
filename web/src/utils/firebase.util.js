let firebase = null;

export async function initializeFB() {
  await import("firebase/app")
    .then(({ default: fbApp }) => {
      fbApp.initializeApp({
        apiKey: "AIzaSyDWJQaehn29UjA7CQIDCCT2M0afHNWQh-c",
        authDomain: "readme-later.firebaseapp.com",
        databaseURL: "https://readme-later.firebaseio.com",
        projectId: "readme-later",
        appId: "1:638206389300:web:9d85217422da672b6b6e61",
        measurementId: "G-GNBXM5DLSC",
      });
      firebase = fbApp;
    })
    .catch((err) => {});
  return await import("firebase/auth");
}

export async function loginFB() {
  await initializeFB();
  var provider = new firebase.auth.GoogleAuthProvider();
  return firebase
    .auth()
    .signInWithPopup(provider)
    .then(function (result) {
      return result.user;
    });
}

export async function onAuthStateChanged(cb) {
  await initializeFB();
  firebase.auth().onAuthStateChanged(cb);
}

export const FBStore = {
  async initialize() {
    await import("firebase/database");
  },

  isLoggedIn() {
    return Boolean(firebase.auth().currentUser);
  },

  getUserId() {
    return this.isLoggedIn() && firebase.auth().currentUser.uid;
  },

  async uploadData({ urls, tags }, userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    await this.initialize();
    firebase.database().ref(`users/${userId}/links`).update(urls);
    firebase.database().ref(`users/${userId}/tags`).update(tags);
  },

  async updateTags(tags, userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    await this.initialize();
    firebase.database().ref(`users/${userId}/tags`).set(tags);
  },

  async setLink(link, userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    await this.initialize();
    firebase.database().ref(`users/${userId}/links/${link.id}`).update(link);
  },

  async deleteLink(linkId, userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    firebase.database().ref(`users/${userId}/links/${linkId}`).remove();
  },

  async getLinks(userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    await this.initialize();
    return new Promise((resolve, reject) => {
      firebase
        .database()
        .ref(`users/${userId}/links`)
        .once("value", (snapShot) => {
          resolve(snapShot.val());
        });
    });
  },

  async getTags(userId = this.getUserId()) {
    if (!this.isLoggedIn()) return;
    await this.initialize();
    return new Promise((resolve, reject) => {
      firebase
        .database()
        .ref(`users/${userId}/tags`)
        .once("value", (snapShot) => {
          resolve(snapShot.val());
        });
    });
  },
};
