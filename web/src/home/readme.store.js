import createStore from "zustand";
import produce from "immer";
import Fuse from "fuse.js";

import {
  addUrl as addUrlToDB,
  getAllData as getFromDB,
  updateUrl,
  addTag,
  deleteUrl as deleteUrlFromDB,
} from "./readme.db";

import { FBStore } from "../utils/firebase.util";

export const [useStore, StoreApi] = createStore((setState, getState) => {
  return {
    urls: {},
    tags: [],
    selectedTags: [],
    filteredUrls: [],
    searchedUrls: [],
    initialize(links, tags) {
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

        setState({
          urls: linkObjs,
          tags,
          searchedUrls: Object.keys(linkObjs),
        });
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

    setUrls(links) {
      setState({ urls: links });
    },

    setTags(tags) {
      setState({ tags });
    },

    selectTag(tag) {
      let selectedTags = getState().selectedTags;
      if (selectedTags.includes(tag) === false) {
        setState(
          produce((state) => {
            state.selectedTags.push(tag);
            return state;
          })
        );
      } else {
        setState({
          selectedTags: selectedTags.filter((t) => t !== tag),
        });
      }

      getState().filterUrls();
    },

    filterUrls() {
      let { selectedTags, urls } = getState();

      let filteredUrls = Object.values(urls).filter((url) => {
        let tagStr = url.tags.join(",");
        let matchedTags = selectedTags
          .map((tag) => tagStr.search(new RegExp(tag)) > -1)
          .filter(Boolean);
        return selectedTags.length === matchedTags.length;
      });

      setState({
        filteredUrls,
      });
    },

    searchUrls(searchText) {
      let { urls } = getState();
      let searchKeys = ["title", "tags", "description"];
      //by default the result will hold all the values
      let searchResults = Object.keys(urls);
      const fuse = new Fuse(Object.values(urls), {
        keys: searchKeys,
      });

      if (searchText) {
        searchResults = fuse.search(searchText).map((data) => data.item.id);
      }
      setState({
        searchedUrls: searchResults,
      });
    },

    addUrl(url) {
      var data = { key: "050cf96571c92512e2fac3f36fe5c0e9", q: url };
      return fetch("https://api.linkpreview.net", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((res) => {
          res.title = res.title || url;
          let link = Object.assign(
            {
              id: new Date().getTime(),
              createdAt: new Date(),
              tags: getState().selectedTags,
            },
            res
          );
          let urls = Object.assign(
            {
              [link.id]: link,
            },
            getState().urls
          );
          setState({
            urls,
            searchedUrls: Object.keys(urls),
          });
          FBStore.setLink(link);
          addUrlToDB(link);
        });
    },

    updateUrl(urlId, data = {}) {
      setState(
        produce((state) => {
          state.urls[urlId] = Object.assign({}, state.urls[urlId], data);
          return state;
        })
      );
      FBStore.setLink(Object.assign({ id: urlId }, data));
      updateUrl(urlId, data);
    },

    deleteUrl(urlId) {
      let { [urlId]: omit, ...urls } = getState().urls;
      setState({
        urls,
        searchedUrls: Object.keys(urls),
      });
      // setState(
      //   produce((state) => {
      //     Reflect.deleteProperty(state.urls, urlId);
      //     return state;
      //   })
      // );
      FBStore.deleteLink(urlId);
      deleteUrlFromDB(urlId);
    },

    addTag(tag, urlId) {
      let hasChanged = false;
      setState(
        produce((state) => {
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
        FBStore.setLink({ id: urlId, tags: getState().urls[urlId].tags });
      }
    },

    removeTag(tagToRemove, urlId) {
      let hasChanged = false;
      setState(
        produce((state) => {
          state.urls[urlId].tags = state.urls[urlId].tags || [];
          if (state.urls[urlId].tags.includes(tagToRemove)) {
            state.urls[urlId].tags = state.urls[urlId].tags.filter(
              (tag) => tag !== tagToRemove
            );
            hasChanged = true;
          }
          return state;
        })
      );
      if (hasChanged) {
        updateUrl(urlId, { tags: getState().urls[urlId].tags });
        FBStore.setLink({ id: urlId, tags: getState().urls[urlId].tags });
      }
    },
  };
});
