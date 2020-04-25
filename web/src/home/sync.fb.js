import { FBStore, onAuthStateChanged } from "../utils/firebase.util";
import { getDB, getAllData } from "./readme.db";
import { StoreApi } from "./readme.store";

export function syncDbFromFBOnceUserSignedIn() {
  let db = getDB();
  onAuthStateChanged(async (user) => {
    if (user) {
      console.log("firebase user", user);
      db.links.count(async function (count) {
        if (count === 0) {
          //sync local db from firebase
          let links = await FBStore.getLinks();
          if (links) {
            StoreApi.getState().setUrls(links);
            db.links.bulkAdd(Object.values(links));
          }
        } else {
          //sync local db  to firebase when user login firstTime with links already added
          let { urls } = await getAllData();
          urls = urls.reduce((cc, url) => {
            cc[url.id] = url;
            return cc;
          }, {});
          console.log("sync ", urls);
          const tags = await db.tags.toArray();
          FBStore.uploadData({ urls, tags });
        }
      });

      let tags = await FBStore.getTags();
      if (tags) {
        db.tags.bulkAdd(tags);
        tags = tags.map((tag) => tag.name);
        StoreApi.getState().setTags(tags);
      }
    }
  });
}
