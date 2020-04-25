import Dexie from "dexie";

const db = new Dexie("readMeLater");

db.version(1).stores({
  links: "id, url, title",
  tags: "++id, &name",
});

(function setUpDatabase() {
  db.tags.count(function (count) {
    if (count === 0) {
      let defaultTags = [
        { name: "React" },
        { name: "Javascript" },
        { name: "Angular" },
        { name: "Python" },
        { name: "Go" },
        { name: "Tools" },
        { name: "Webpack" },
        { name: "OpenSource" },
      ];
      db.tags.bulkAdd(defaultTags);
    }
  });
})();

window.addEventListener("unhandledrejection", function dbErrors(errs) {
  console.log("db errors", errs);
});

export function getDB() {
  return db;
}

export async function addUrl(urlData) {
  await db.links.add(urlData);
}

export async function updateUrl(id, urlData) {
  let data = await db.links.update(id, urlData);
  console.log(" updated data ", data);
}

export async function deleteUrl(id) {
  await db.links.where("id").equals(id).delete();
}

export async function addTag(tag) {
  let data = await db.tags.add({ name: tag });
  console.log(" updated tags data ", data);
}

export async function getAllData() {
  let urls = await db.links.orderBy("id").reverse().toArray();
  console.log("urls ", urls);
  let tags = await db.tags.toArray();

  return { urls, tags: tags.map((tag) => tag.name) };
}
