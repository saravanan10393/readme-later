import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Card,
  H2,
  H3,
  EditableText,
  Menu,
  MenuItem,
  Tag,
  Intent,
  Label,
  Classes,
  Tooltip,
} from "@blueprintjs/core";

import {
  Add as AddIcon,
  GitRepo as GitRepoIcon,
  Trash as TrashIcon,
  Tag as TagIcon,
  Search as SearchIcon,
} from "@blueprintjs/icons";
import { Select } from "@blueprintjs/select";
import Masonry from "react-masonry-css";

import { useEnter } from "../utils/useEnter";
import { SyncLabel } from "../auth";

import { useStore, StoreApi } from "./readme.store";
import { syncDbFromFBOnceUserSignedIn } from "./sync.fb";

import styles from "./home.css";
import "./home.override.css";

export function Home() {
  useEffect(function initializeLinks() {
    StoreApi.getState().initialize();
    syncDbFromFBOnceUserSignedIn();
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.topNav}>
        <H2 className="thalavam-600">Readme later</H2>
        <Filterbox />
        <SyncLabel />
        <Tooltip content="Github">
          <a
            target="blank"
            href="https://github.com/saravanan10393/readme-later"
            intent={Intent.NONE}
            className="bp4-button bp4-minimal"
            role="button"
            tabIndex={0}
          >
            <GitRepoIcon />
          </a>
        </Tooltip>
      </div>
      <div className={styles.container}>
        <div className={styles.sideNav}>
          <SideMenu />
        </div>
        <div className={`${styles.contentContainer}`}>
          <LinkContainer />
        </div>
      </div>
    </div>
  );
}

function Filterbox() {
  let inputRef = React.useRef();
  let [keyword, setKeyWord] = useState("");

  useEffect(function searchShortCut() {
    console.log("registering eventgs");
    function keydownHandler(e) {
      if (e.key === "f" && e.metaKey) {
        e.preventDefault();
        inputRef.current.focus();
      }
    }

    document.addEventListener("keydown", keydownHandler);
    return () => document.removeEventListener("keydown", keydownHandler);
  }, []);

  useEffect(
    function debounce() {
      let { searchUrls } = StoreApi.getState();
      let timerId = setTimeout(function () {
        console.log(" debouce called ", keyword);
        searchUrls(keyword);
      }, 200);
      return () => clearTimeout(timerId);
    },
    [keyword]
  );

  const onSearch = (e) => {
    setKeyWord(e.target.value);
  };

  return (
    <div className={styles.searchBox}>
      <div className="bp4-input-group bp4.large">
        <SearchIcon />
        <input
          value={keyword}
          onChange={onSearch}
          ref={inputRef}
          className="bp4-input"
          type="search"
          placeholder="Search input"
          dir="auto"
        />
      </div>
    </div>
  );
}

function SideMenu() {
  let tags = useStore((state) => state.tags);
  let selectedTags = useStore((state) => state.selectedTags);

  let isActive = (tag) => selectedTags.includes(tag);
  let selectTag = StoreApi.getState().selectTag;

  return (
    <Menu>
      <li className="bp4-menu-header">
        <TagIcon />
        <span className="bp4-heading h5">View by tags</span>
      </li>
      {tags.map((tag) => {
        let active = isActive(tag);
        return (
          <MenuItem
            active={active}
            intent={active ? Intent.WARNING : Intent.NONE}
            key={tag}
            text={tag}
            onClick={() => selectTag(tag)}
          />
        );
      })}
    </Menu>
  );
}

function LinkContainer() {
  let { allUrls, filteredUrls, selectedTags, searchedUrls } = useStore(
    (state) => ({
      allUrls: state.urls,
      filteredUrls: state.filteredUrls,
      selectedTags: state.selectedTags,
      searchedUrls: state.searchedUrls,
    })
  );

  let gridRef = useRef(null);

  const getLinks = () => {
    if (selectedTags.length > 0) {
      return filteredUrls.map((url) => allUrls[url.id]);
    }
    return searchedUrls.map((urlId) => allUrls[urlId]);
  };

  const breakpointColumnsObj = {
    default: 6,
    1600: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className={"my-masonry-grid"}
      columnClassName={"my-masonry-grid_column"}
    >
      {[<AddUrlCard key={"addCard"} grid={gridRef.current} />].concat(
        getLinks().map((link, i) => {
          return <LinkCard link={link} key={link.id} grid={gridRef.current} />;
        })
      )}
    </Masonry>
  );
}

function AddUrlCard() {
  let [url, setUrl] = useState("");
  let [loading, setLoading] = useState(false);
  let [error, setError] = useState("");

  const addUrl = () => {
    if (!url.trim() || loading) return;
    if (!isValidUrl(url)) {
      return setError("Invalid url");
    }
    setError("");
    setLoading(true);
    StoreApi.getState()
      .addUrl(url)
      .then(() => setUrl(""))
      .finally(() => {
        setLoading(false);
      });
  };

  const onChange = (evt) => {
    setUrl(evt.target.value);
  };

  const onEnter = useEnter(function onEnter(evt) {
    addUrl();
  });

  const isValidUrl = (url) => {
    return new RegExp(
      "https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}([-a-zA-Z0-9()@:%_+.~#?&//=]*)"
    ).test(url);
  };

  return (
    <Card
      key="addCard"
      className={`zoomIn ${styles.addUrl} masonry-grid-item`}
      interactive
    >
      <H3>Add Url</H3>
      <input
        className={Classes.INPUT}
        value={url}
        type="text"
        autoFocus
        placeholder="Paste url"
        onChange={onChange}
        onKeyDown={onEnter}
        intent={error ? Intent.DANGER : Intent.PRIMARY}
      />
      {error && <Label intent={Intent.DANGER}>{error}</Label>}
      <Button intent="primary" onClick={addUrl} loading={loading}>
        Add
      </Button>
    </Card>
  );
}

function LinkCard({ link }) {
  LinkCard.propTypes = {
    link: PropTypes.object.isRequired,
  };

  let tags = useStore((state) => state.tags);

  // const updateTitle = useCallback(
  //   (value) => {
  //     StoreApi.getState().updateUrl(link.id, { title: value });
  //   },
  //   [link.id]
  // );

  const updateDescription = useCallback(
    (value) => {
      StoreApi.getState().updateUrl(link.id, { description: value });
    },
    [link.id]
  );

  const addTag = (tag) => {
    StoreApi.getState().addTag(tag, link.id);
  };

  const removeTag = (evt, tagProps) => {
    let { children: tag } = tagProps;
    StoreApi.getState().removeTag(tag, link.id);
  };

  const deleteUrl = () => {
    StoreApi.getState().deleteUrl(link.id);
  };

  const renderTag = (tag, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    // console.log("predicate ", modifiers);
    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={tag}
        onClick={handleClick}
        text={tag}
      />
    );
  };

  const filterTags = (query, tag, _index, exactMatch) => {
    const normalizedTag = `${tag}`.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (exactMatch) {
      return normalizedTag === normalizedQuery;
    } else {
      return `${normalizedTag}`.indexOf(normalizedQuery) >= 0;
    }
  };

  const renderCreateTagOption = (query, active, handleClick) => (
    <MenuItem
      icon={<AddIcon />}
      text={`Create "${query}"`}
      active={active}
      onClick={handleClick}
      shouldDismissPopover={false}
    />
  );

  function returnTagType(tag) {
    return tag;
  }

  return (
    <Card className={`zoomIn ${styles.card} masonry-grid-item`} interactive>
      <div>
        <H3 title={link.title}>
          <a
            href={link.url}
            className={styles.cardLink}
            target="blank"
            intent="primary"
          >
            {link.title}
          </a>
        </H3>
        <Button
          onClick={deleteUrl}
          className={styles.deleteButton}
          minimal
          icon={<TrashIcon />}
          intent={Intent.DANGER}
        />
      </div>
      <img
        className={styles.image}
        loading="lazy"
        src={link.image}
        alt={link.title}
      />
      <p className={`marutham`}>
        <EditableText
          defaultValue={link.description}
          maxLength={200}
          multiline
          onConfirm={updateDescription}
          placeholder="Description goes here..."
        />
      </p>
      <div className={styles.tagList}>
        {(link.tags || []).map((tag) => (
          <Tag
            className={styles.tag}
            interactive
            removable
            key={tag}
            onRemove={removeTag}
          >
            {tag}
          </Tag>
        ))}
        <Select
          items={tags}
          itemRenderer={renderTag}
          itemPredicate={filterTags}
          onItemSelect={addTag}
          noResults={<MenuItem disabled text="No results." />}
          inputProps={{ placeholder: "Add tags" }}
          className={styles.select}
          filterable
          resetOnClose
          resetOnQuery
          createNewItemFromQuery={returnTagType}
          createNewItemRenderer={renderCreateTagOption}
        >
          <Button minimal>
            <AddIcon intent="primary" />
          </Button>
        </Select>
      </div>
    </Card>
  );
}
