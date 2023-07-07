---
layout: title.njk
title: Elasticsearch and Webmapping
description: >
  Two hours workshop on how different ways
  to render Elasticsearch data on a web map application using 
  Maplibre.
permalink: /
---

## About

> This is part of the larger [Elastic Workshop](https://github.com/jsanz/elastic-workshop/) repository.

In this two hours session, first, there are details on how to set up an Elasticsearch cluster to accept search and aggregation requests using Vector Tiles as the output format.

With a cluster ready, we can explore two main types of data rendering: individual documents and grid aggregations using different spatial indices.

## Slides

<https://ela.st/2023-elastic-foss4g-slides>

## Data preparation

> Full details on how to install these datasets and others can be found [here](https://gist.github.com/jsanz/235570f46634269ee354c831f87caf65)

On an Elasticsearch 8.x cluster add this setting to the `elasticsearch.yml` file to allow restoring snapshots from a [Read-only URL repository](https://www.elastic.co/guide/en/elasticsearch/reference/master/snapshots-read-only-repository.html).

```yaml
repositories.url.allowed_urls: 
        - "https://storage.googleapis.com/jsanz-bucket/*"
```

To accept requests for vector tiles from a browser we also need to enable CORS in Elasticsearch so, again in the `elasticsearch.yml`:

```yaml
http.cors: 
    enabled : true
    allow-origin: "*"
    allow-methods: OPTIONS, HEAD, GET, POST
    allow-headers: "X-Requested-With, Content-Type, Content-Length, Authorization, Accept, User-Agent, X-Elastic-Client-Meta, Cache-Control"
```

> ⚠ Be sure to read the [networking documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-network.html) carefully if you are working with a production cluster to understand the implications of allowing CORS requests


Restart the cluster to activate this URL and then you can create a couple of snapshots repositories and restore some indices with [NYC 311](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9) data and the [Geonames database](http://www.geonames.org/).

<details>
<summary>Loading datasets 🔽</summary>

```text
# ==== NYC 311 ====
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


# ==== Geonames ====

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


# ==== OSM Andorra ====

# Add the OSM snapshots repository
PUT /_snapshot/osm
{
  "type": "url",
  "settings": {
    "url": "https://storage.googleapis.com/jsanz-bucket/v8/osm/"
  }
}

# Check the osm_andorra snapshot is available available
GET _snapshot/osm/osm_andorra

# Restore osm_andorra data (async)
POST /_snapshot/osm/osm_andorra/_restore

# Expose this index with two filtered aliases
POST _aliases
{
  "actions": [
    {
      "add": {
        "index": "osm_andorra",
        "alias": "osm_highways_andorra",
        "filter": {
          "bool": {
            "filter": [
              {
                "bool": {
                  "minimum_should_match": 1,
                  "should": [
                    {
                      "exists": {
                        "field": "highway"
                      }
                    }
                  ]
                }
              },
              {
                "bool": {
                  "minimum_should_match": 1,
                  "should": [
                    {
                      "term": {
                        "osm_type": {
                          "value": "way"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "add": {
        "index": "osm_andorra",
        "alias": "osm_buildings_andorra",
        "filter": {
          "bool": {
            "filter": [
              {
                "bool": {
                  "minimum_should_match": 1,
                  "should": [
                    {
                      "exists": {
                        "field": "building"
                      }
                    }
                  ]
                }
              },
              {
                "bool": {
                  "minimum_should_match": 1,
                  "should": [
                    {
                      "term": {
                        "osm_type": {
                          "value": "area"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```
</details>

You need to wait for the data to be downloaded and restored. Check the indices in your cluster with:

```text
GET _cat/indices?v&h=index,docs.count&s=index
```

Create the corresponding data views for Kibana from the Stack Management interface or with the following Console commands for the [Create Data View API](https://www.elastic.co/guide/en/kibana/master/data-views-api-create.html)

<details>
<summary>Creating Kibana Data Views 🔽</summary>

```text
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


POST kbn://api/data_views/data_view
{
  "data_view": {
    "title": "osm_andorra",
    "name": "OpenStreetMap Andorra",
    "timeFieldName": "timestamp"
  }
}
```
</details>

## Setting up Elasticsearch API key

Create a `workshop` API key that can view the indices we just created and that will expire in five days.


<details>
<summary>Create an API key 🔽</summary>

```text
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
          "nyc_boroughs",
          "osm_*"
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
</details>

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
$ ELASTIC_HOST="https://your-cluster-url"
$ ELASTIC_APIKEY="your-encoded-name-and-api-key-here"
$ curl -H "Authorization: ApiKey ${ELASTIC_APIKEY}" \
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

If you are familiar with the NodeJS stack then you can download the dependencies (`yarn install` or  `npm install`) and start a development server (`yarn start` or `npm start`) so you can edit the code in the source files and the page will reload automatically.

* `_includes/map.njk` and ` _includes/map-docs.njk` contain the common code to initialize the different map pages
* `pages/X.html` contains the HTML markup and the JavaScript code to run that page.

The target `yarn build` or `npm build` will generate the output files in the `dist` folder that can be uploaded to any static webserver (Github Pages, Vercel, Netlify, and so on).
