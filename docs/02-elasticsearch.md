## Elasticsearch queries 

Elasticsearch is entirely managed via REST API endpoints. All management, ingesting, querying, aggregating, etc. is done through REST endpoints. Queries in particular need a rich query language that allow to express all kind of requirements. This is just a glimpse of some interesting queries to give you an idea but you should navigate the [documentation][apis] for further details.

### Management

Creating a [new user][users] with a given password and role:

```json
POST /_security/user/wecode00
{
  "password" : "pucela00",
  "roles" : [ "wecode_student"]
}
```

Create an index with a given mapping that contains a [`geo_point`][geo_point] type:

```json
PUT wecode00_test
{
  "mappings":{
    "properties": {
      "location": {
        "type": "geo_point"
      },
      "category": {
        "type": "keyword"
      },
      "title": {
        "type": "text"
      }
    }
  }
}
```

**IMPORTANT**: if you are sharing the Elastic instance remember to use different prefixes instead of `wecode00_` to avoid overwriting other attendants data!!

### Inserting points

As a string: latitude, longitude

```json
POST wecode00_test/_doc
{
  "location": "41.12,-71.34",
  "category": "place name",
  "title": "Null Island"
}
```

As a [geohash][geohash]:

```json
POST wecode00_test/_doc
{
  "location": "drm3btev3e86",
  "category": "place name 2",
  "title": "Somewhere"
}
```

As an array: longitude, latitude

```json
POST wecode00_test/_doc
{
  "location": [ -71.34, 41.12 ] ,
  "category": "place name 3",
  "title": "Somewhere 3"
}
```

As an object:

```json
POST wecode00_test/_doc
{
  "location": {
      "lat": 41.12,
      "lon": -71.34
  } ,
  "category": "place name 3",
  "title": "Somewhere 3"
}
```

### Bulk insertion:

Let's define a new index with a mapping:

```json
PUT wecode00_airports
{
    "mappings": {
        "properties": {
            "coords": {
                "type": "geo_point"
            },
            "abbrev": {
                "type": "keyword"
            },
            "name": {
                "type": "text"
            },
            "type": {
                "type": "keyword"
            }
        }
    }
}
```

We can insert more than one document in a single `_bulk` request:

```json
PUT _bulk
{ "index" : { "_index" : "wecode00_airports", "_id" : "1" } }
{"coords":[75.9570722,30.8503599],"name":"Sahnewal","abbrev":"LUH","type":"small"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "2" } }
{"coords":[75.9330598,17.6254152],"name":"Solapur","abbrev":"SSE","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "3" } }
{"coords":[85.323597,23.3177246],"name":"Birsa Munda","abbrev":"IXR","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "4" } }
{"coords":[48.7471065,31.3431586],"name":"Ahwaz","abbrev":"AWZ","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "5" } }
{"coords":[78.2172187,26.2854877],"name":"Gwalior","abbrev":"GWL","type":"mid and military"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "6" } }
{"coords":[42.9710963,14.7552534],"name":"Hodeidah Int'l","abbrev":"HOD","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "7" } }
{"coords":[75.8092915,22.7277492],"name":"Devi Ahilyabai Holkar Int'l","abbrev":"IDR","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "8" } }
{"coords":[73.8105675,19.9660206],"name":"Gandhinagar","abbrev":"ISK","type":"mid"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "9" } }
{"coords":[76.8017261,30.6707249],"name":"Chandigarh Int'l","abbrev":"IXC","type":"major and military"}
{ "index" : { "_index" : "wecode00_airports", "_id" : "10" } }
{"coords":[75.3958433,19.867297],"name":"Aurangabad","abbrev":"IXU","type":"mid"}
```

You can find a complete dataset with airports from all over the world in the `/lab/airports/airports.bulk` file if you want to populate your index with almost 900 points.

### Querying

[Filter][bool] by value, get only a number of columns and order the results

```
GET flight_tracking*/_search
{
  "size": 5,
  "_source": ["timePosition", "callsign", "location", "velocity"],
  "query":{
    "bool": {
      "filter": {
        "term": {
          "originCountry": "China"
        }
      }
    }
  },
  "sort": [
    {
      "timePosition": "desc"
    }
  ]
}
```

Just get the number of results using `_count` instead of `_search` using a [`bool`][bool] query with a filter.

```
GET flight_tracking*/_count
{
  "query":{
    "bool": {
      "filter": {
        "term": {
          "originCountry": "China"
        }
      }
    }
  }
}
```

A more complex [`query_string`][query_string] query using wildcards and operators

```
GET flight_tracking*/_search
{
  "query": {
    "query_string": {
            "query" : "RYR* OR ACA*",
            "default_field" : "callsign"
    }
  }
}
```


Combining queries with filters using the [`bool` compounded query][bool].

```
GET flight_tracking*/_search
{
  "_source": [ "callsign", "timePosition", "onGround" ],
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "RYR*",
            "default_field": "callsign"
          }
        }
      ],
      "filter": [
        { "term": { "onGround": "true" } },
        { "range": { "timePosition": { "gte": "now-1d/h" } } }
      ]
    }
  }
}
```


### Aggregations

Get some aggregations (metrics and histogram buckets) for positions that are not on the ground, for the last 30 minutes, and with positive altitudes.

```GET flight_tracking*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "onGround": "false" } },
        { "range": { "timePosition": { "gte": "now-30m/m" } } },
        { "range": { "geoAltitude": { "gte": 0 } } }
      ]
    }
  },
  "aggs": {
    "avg_speed": { "avg": { "field": "velocity" } },
    "geoAltitude_stats": { "stats": { "field": "geoAltitude" } },
    "altitude_percentiles": {
      "percentiles": {
        "field": "geoAltitude",
        "percents": [ 0, 5, 10, 25, 50, 75, 90, 95, 100 ]
      }
    },
    "positions_over_time": {
      "date_histogram": {
        "field": "timePosition",
        "fixed_interval": "10m"
      }
    },
    "speed_histogram": {
      "histogram": {
        "field": "velocity",
        "interval": 50
      }
    }
  }
}
```

See that by default aggregations are returned along with the search results but usually you want one or another, thus this query asks for no individual documents (`"size": 0`).

[apis]: https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html
[users]: https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-put-user.html
[geo_point]: https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html
[query_string]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
[bool]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html 
[geohash]: https://en.wikipedia.org/wiki/Geohash