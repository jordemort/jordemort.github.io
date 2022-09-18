<script lang="ts" setup>

import { Ref, ref, watch } from "vue";
import * as sqljs from 'sql.js-httpvfs';
import { SearchClient } from "../search/client";
import type { SearchResult } from "../search/client";

const { createDbWorker } = sqljs;

var client: SearchClient;
var timeout: any;

const query = ref("");
const results: Ref<SearchResult[]> = ref([]);
const noResults = ref(false);
const queryError = ref("")

async function getClient() {
  if (!client) {
    try {
      console.log("initializing client");

      let worker = await createDbWorker(
        [
          {
            from: "inline",
            config: {
              serverMode: "full",
              url: "/index.sqlite3",
              requestChunkSize: 4096,
            },
          },
        ],
        "/scripts/sqlite.worker.js",
        "/scripts/sql-wasm.wasm"
      );

      client = new SearchClient(worker);
    } catch (e) {
      queryError.value = (e as Error).message;
    }
  }

  return client;
}

async function doQuery() {
  const progressValue = document.getElementById("progressValue") as HTMLDivElement;
  let client = await getClient();

  if (!client) {
    progressValue.style.display = "none";
    return;
  }

  let q = query.value.trim();

  if (q.length < 1) {
    progressValue.style.display = "none";
    return;
  }

  try {
    results.value = await client.search(query.value);
  } catch (e) {
    queryError.value = e as string;
    results.value = [];
  }

  progressValue.style.display = "none";
  noResults.value = (results.value.length < 1);
}

async function closeSearch() {
  (document.getElementById("hideSearch") as HTMLDivElement).style.display = "none";
}

watch(query, (_, value) => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  noResults.value = false;
  (document.getElementById("progressValue") as HTMLDivElement).style.display = "block";
  timeout = setTimeout(doQuery, 250);
});

</script>

<template>
  <div id="search" class="searchOverlay">
    <div class="searchUI">
      <div class="closeSearch" @click="closeSearch()"><button @click="closeSearch()">close ☒</button></div>
      <div class="searchBar">
        <input v-model="query" id="searchInput" placeholder="Search"/>
        <label for="searchInput">Search</label>
      </div>
      <div class="progressContainer">
        <div class="progressBar">
          <div id="progressValue"></div>
        </div>
      </div>
      <div class="searchContents" v-if="queryError || noResults || results.length">
        <div v-if="queryError" style="color: red"><b>Error querying index:</b><br /><br />{{ queryError }}</div>
        <div class="noResults" v-if="noResults && !queryError">No results</div>
        <div class="searchResult" v-for="result in results">
          <div class="resultName"><a :href="result.url" v-html="result.name"></a></div>
          <div v-if="result.summary?.includes('<b>')"><em v-html="result.summary"></em></div>
          <div>
            <span v-for="category in result.categories?.split(' ')" v-if="result.categories?.includes('<b>')">
              <span v-html="category" v-if="category.includes('<b>')" class="p-category"></span>
            </span>
          </div>
          <div v-html="result.content"></div>
        </div>
      </div>
      <div class="searchTagline" v-if="results.length && !(noResults || queryError)">Search powered by jordemort.dev</div>
    </div>
  </div>
</template>

<style>
  .searchOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100%;
    max-height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 100;
  }

  .searchUI {
    margin-top: 5em;
    margin-left: auto;
    margin-right: auto;
    max-width: 90%;
    width: 720px;
    filter: drop-shadow(0 0 0.5rem #000);
  }

  .searchBar {
    position: relative;
  }

  .closeSearch {
    width: 100%;
    text-align: right;
  }

  .closeSearch button {
    background-color: #000;
    border: none;
    padding-left: 4px;
    padding-right: 4px;
    margin: 0;
    color: #fff;
    text-decoration: none;
    font-size: small;
    font-variant: small-caps;
  }

  .searchBar input {
    width: calc(100% - 4px);
    max-width: 100%;
    padding-top: 20px;
    font-size: 24px;
    border: none;
    background-color: #fff;
    color: #000;
    border-bottom: 2px solid #fff;
  }

  .searchBar input::placeholder {
    opacity: 0;
  }

  .searchBar label {
    position: absolute;
    bottom: 2px;
    left: 0;
    transition-duration: 200ms;
    font-size: 30px;
    padding-top: 1px;
    padding-bottom: 0;
    padding-left: 3px;
    color: #aaa;
  }

  .searchBar input:focus-within {
    border: none;
    outline: none;
    border-bottom: 2px solid #000;
  }

  .searchBar input:focus-within + label,
  .searchBar input:not(:placeholder-shown) + label {
    transform: translateY(-30px);
    font-size: 14px;
  }

  .progressBar {
    height: 4px;
    background-color: #3273dc;
    width: 100%;
    overflow: hidden;
  }

  #progressValue {
    width: 100%;
    height: 100%;
    background-color: #ccc;
    animation: indeterminateAnimation 1s infinite linear;
    transform-origin: 0% 50%;
    display: none;
  }

  @keyframes indeterminateAnimation {
    0% {
      transform:  translateX(0) scaleX(0);
    }
    40% {
      transform:  translateX(0) scaleX(0.4);
    }
    100% {
      transform:  translateX(100%) scaleX(0.5);
    }
  }

  .searchContents {
    background-color: #fff;
    padding-top: 8px;
    padding-bottom: 8px;
    overflow-y: auto;
    min-height: 4em;
    max-height: calc(90vh - 12em);
  }

  .searchContents div {
    margin-left: 8px;
    margin-right: 8px;
  }

  .searchResult {
    padding-top: 1em;
    padding-bottom: 1em;
    border-bottom: 1px dotted #ccc;
  }

  .searchResult:first-child {
    padding-top: 0;
  }

  .resultName {
    font-size: larger;
  }

  .noResults {
    text-align: center;
    font-size: larger;
    font-style: italic;
    opacity: 0.8;
    padding-top: 1em;
    padding-bottom: 1em;
  }

  .searchTagline {
    text-align: center;
    font-size: x-small;
    background-color: #fff;
  }

  @media (prefers-color-scheme: dark) {
    .searchBar input {
      background-color: #222;
  		color: #b6b8d6;
      border-bottom: 2px solid #222;
    }

    .searchBar input:focus-within {
      border-bottom: 2px solid #fff;
    }

    .progressBar {
      background-color: #9e98f2;
    }

    .searchContents {
      background-color: #222;
    }

    .searchTagline {
      background-color: #222;
    }
  }
</style>
