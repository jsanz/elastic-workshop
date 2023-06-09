---
layout: title.njk
title: Elasticsearch and Webmapping
permalink: /
---

## Slides

<https://ela.st/2023-webmapping-elasticsearch-slides>

## Data preparation

> Full details on how to install these datasets and others can be found [here](https://gist.github.com/jsanz/235570f46634269ee354c831f87caf65)

On an Elasticsearch 8.x cluster add this setting to the `elasticsearch.yml` file to allow restoring snapshots from a [Read-only URL repository](https://www.elastic.co/guide/en/elasticsearch/reference/master/snapshots-read-only-repository.html).

```yaml
repositories.url.allowed_urls: 
        - "https://storage.googleapis.com/jsanz-bucket/*"
```

Restart the cluster to activate this URL and then you can create a couple of snapshots repositories and restore some indices with [NYC 311](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9) data and the [Geonames database](http://www.geonames.org/).

```text
# Add the NYC 311 snapshots repository
PUT /_snapshot/nyc311
{
  "type": "url",
  "settings": {
    "url": "https://storage.googleapis.com/jsanz-bucket/nyc311_repo/"
  }
}

# Check two snapshots are available
GET _snapshot/nyc311/*

# Restore 311 data (async)
POST /_snapshot/nyc311/snapshot_1/_restore

# Restore NYC boroughs data (async)
POST /_snapshot/nyc311/snapshot_2/_restore


# Add the Geonames snapshots repository
PUT /_snapshot/geonames
{
  "type": "url",
  "settings": {
    "url": "https://storage.googleapis.com/jsanz-bucket/v8/geospatial_demos/"
  }
}

# Check the geonames snapshot is available available
GET _snapshot/geonames/geonames

# Restore Geonames data (async)
POST /_snapshot/geonames/geonames/_restore
```

You need to wait for the data to be downloaded and restored. Check the indices in your cluster with:

```
GET _cat/indices?v&h=index,docs.count&s=index
```

Create the corresponding data views for Kibana from the Stack Management interface or with the following Console commands for the [Create Data View API](https://www.elastic.co/guide/en/kibana/master/data-views-api-create.html)

```
POST kbn://api/data_views/data_view
{
  "data_view": {
    "title": "311",
    "name": "NYC 311 calls",
    "timeFieldName": "Created Date"
  }
}

POST kbn://api/data_views/data_view
{
  "data_view": {
    "title": "nyc_boroughs",
    "name": "NYC Boroughs"
  }
}

POST kbn://api/data_views/data_view
{
  "data_view": {
    "title": "NYC",
    "name": "NYC 311 calls",
    "timeFieldName": "Created Date"
  }
}
```

## Setting up Elasticsearch API key

Create a `workshop` API key that can view the indices we just created and that will expire in five days.

```json
POST /_security/api_key
{
  "name": "workshop-api-key",
  "expiration": "5d",   
  "role_descriptors": { 
    "workshop": {
      "index": [
      {
        "names": [
          "geonames",
          "311",
          "nyc_boroughs"
        ],
        "privileges": [
          "read",
          "view_index_metadata"
        ],
        "field_security": {
          "grant": [
            "*"
          ]
        }
      }
      ]
    }
  }
}
```

Write down the result as you'll need those fields on your requests.

```json
{
  "id": "YqAxoIgBclR1XK5t5Ixm",
  "name": "workshop-api-key",
  "expiration": 1688906804330,
  "api_key": "your-api-key-here",
  "encoded": "your-encoded-name-and-api-key-here"
}
```


You can test your API key from curl:

```bash
ELASTIC_HOST="https://your-cluster-url"
ELASTIC_APIKEY="your-encoded-name-and-api-key-here"
curl -H "Authorization: ApiKey ${ELASTIC_APIKEY}" \
  "${ELASTIC_HOST}/geonames/_count?pretty=true"
```

This should return:

```json
{
  "count" : 11968314,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  }
}
```

## Starting the viewer

You can simply serve the `dist` folder from any webserver of your choice:

* Python: `python -m http.server --directory dist 8080`
* NodeJS: `npx http-server -p 8080 dist`
* etc.

Or if you are familiar with the NodeJS stack then you can download the dependencies (`yarn install` or  `npm install`) and start a development server (`yarn start` or `npm start`) so you can edit the code in the source files and the page will reload automatically.

* `_includes/map.njk` contains the common code to initialize the different map pages
* `pages/X.html` contains the HTML markup and the JavaScript code to run that page.

The target `yarn build` or `npm build` will generate the output files in the `dist` folder that can be uploaded to any static webserver (Github Pages, Vercel, Netlify, and so on).
