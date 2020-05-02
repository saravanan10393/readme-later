import { FBStore, onAuthStateChanged } from "../utils/firebase.util";
import { getDB, getAllData } from "./readme.db";
import { StoreApi } from "./readme.store";

export function syncDbFromFBOnceUserSignedIn() {
  let db = getDB();
  onAuthStateChanged(async (user) => {
    if (user) {
      console.log("firebase user", user);
      db.links.count(async function (count) {
        //sync local db  to firebase when user login
        let { urls } = await getAllData();
        urls = urls.reduce((cc, url) => {
          cc[url.id] = url;
          return cc;
        }, {});
        console.log("sync ", urls);
        let tags = await db.tags.toArray();
        await FBStore.uploadData({ urls, tags });

        //sync firebase data to local db
        let links = await FBStore.getLinks();
        if (links) {
          db.links.bulkPut(Object.values(links));
        }

        tags = await FBStore.getTags();
        if (tags) {
          db.tags.bulkPut(tags);
        }
        StoreApi.getState().initialize();
      });
    }
  });
}
