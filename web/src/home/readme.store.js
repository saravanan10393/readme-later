import { create } from "zustand";
import produce from "immer";

import {
  addUrl as addUrlToDB,
  getAllData as getFromDB,
  updateUrl,
  addTag,
  deleteUrl as deleteUrlFromDB
} from "./readme.db";

export const [useStore, StoreApi] = create((setState, getState) => {
  return {
    urls: {},
    tags: [],
    selectedTags: [],
    filteredUrls: [],
    initialize() {
      // let links = new Array(30).fill(10).map(() => ({
      //   id: shortId.generate(),
      //   title: "Google",
      //   description:
      //     "Stay Home. Save Lives : Help Stop Coronavirus #GoogleDoodle",
      //   image:
      //     "https://www.google.com/logos/doodles/2020/stay-home-save-lives-6753651837108752.2-2xa.gif",
      //   url: "https://www.google.com/",
      //   tags: ["general"]
      // }));

      // let linkObjs = links.reduce((c, link) => {
      //   c[link.id] = link;
      //   return c;
      // }, {});

      // let tags = new Array(20).fill(10).map(() => Math.random() * 100000);

      getFromDB().then(({ urls, tags }) => {
        console.log(" retrived value from db ", urls, tags);
        let linkObjs = urls.reduce((c, link) => {
          c[link.id] = link;
          return c;
        }, {});

        setState(
          produce(state => {
            state.urls = linkObjs;
            state.tags = tags;
            return state;
          })
        );
      });

      // setState(
      //   produce(state => {
      //     state.urls = linkObjs;
      //     state.tags = tags;
      //     return state;
      //   })
      // );
    },
    getUrls() {},

    selectTag(tag) {
      let selectedTags = getState().selectedTags;
      if (selectedTags.includes(tag) === false) {
        setState(
          produce(state => {
            state.selectedTags.push(tag);
            return state;
          })
        );
      } else {
        setState({
          selectedTags: selectedTags.filter(t => t !== tag)
        });
      }

      getState().filterUrls();
    },

    filterUrls() {
      let { selectedTags, urls } = getState();

      let filteredUrls = Object.values(urls).filter(url => {
        let tagStr = url.tags.join(",");
        let matchedTags = selectedTags
          .map(tag => tagStr.search(new RegExp(tag)) > -1)
          .filter(Boolean);
        return selectedTags.length === matchedTags.length;
      });

      setState({
        filteredUrls
      });
    },

    addUrl(url) {
      var data = { key: "050cf96571c92512e2fac3f36fe5c0e9", q: url };
      return fetch("https://api.linkpreview.net", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(res => {
          res.title = res.title || url;
          let preview = Object.assign(
            {
              id: new Date().getTime(),
              createdAt: new Date(),
              tags: getState().selectedTags
            },
            res
          );
          setState({
            urls: Object.assign(
              {
                [preview.id]: preview
              },
              getState().urls
            )
          });
          //   produce(state => {
          //     state.urls[preview.id] = preview;
          //     return state;
          //   })
          // );
          addUrlToDB(preview);
        });
    },

    updateUrl(urlId, data = {}) {
      setState(
        produce(state => {
          state.urls[urlId] = Object.assign({}, state.urls[urlId], data);
          return state;
        })
      );

      updateUrl(urlId, data);
    },

    deleteUrl(urlId) {
      setState(
        produce(state => {
          Reflect.deleteProperty(state.urls, urlId);
          return state;
        })
      );
      deleteUrlFromDB(urlId);
    },

    addTag(tag, urlId) {
      let hasChanged = false;
      setState(
        produce(state => {
          state.urls[urlId].tags = state.urls[urlId].tags || [];
          if (state.urls[urlId].tags.includes(tag) === false) {
            state.urls[urlId].tags.push(tag);
            hasChanged = true;
          }
          if (state.tags.includes(tag) === false) {
            state.tags.push(tag);
            addTag(tag);
          }
          return state;
        })
      );
      if (hasChanged) {
        updateUrl(urlId, { tags: getState().urls[urlId].tags });
      }
    },

    removeTag(tagToRemove, urlId) {
      let hasChanged = false;
      setState(
        produce(state => {
          state.urls[urlId].tags = state.urls[urlId].tags || [];
          if (state.urls[urlId].tags.includes(tagToRemove)) {
            state.urls[urlId].tags = state.urls[urlId].tags.filter(
              tag => tag !== tagToRemove
            );
            hasChanged = true;
          }
          return state;
        })
      );
      if (hasChanged) {
        updateUrl(urlId, { tags: getState().urls[urlId].tags });
      }
    }
  };
});
