## Notes

### Management

Creating a new user with a given password and role:

```
POST /_security/user/wecode00
{
  "password" : "pucela00",
  "roles" : [ "wecode_student"]
}
```

Create an index with a `geo_point` type:
```
PUT wecode_test
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


### Inserting

Creating new documents: 

```
# As a string: latitude, longitude
POST wecode_test/_doc
{
  "location": "41.12,-71.34",
  "category": "place name",
  "title": "Null Island"
}

# As a geohash: https://en.wikipedia.org/wiki/Geohash
POST wecode_test/_doc
{
  "location": "drm3btev3e86",
  "category": "place name 2",
  "title": "Somewhere"
}

# As an array: longitude, latitude
POST wecode_test/_doc
{
  "location": [ -71.34, 41.12 ] ,
  "category": "place name 3",
  "title": "Somewhere 3"
}

# As an object
POST wecode_test/_doc
{
  "location": {
      "lat": 41.12,
      "lon": -71.34
  } ,
  "category": "place name 3",
  "title": "Somewhere 3"
}
```

### Querying

Filter by value, get only a number of columns and order the results
```
GET flight_tracking*/_search
{
  "size": 5,
  "_source": ["timePosition" ,"location","velocity"],
  "query":{
    "bool": {
      "filter": {
        "term": {
          "callsign": "AZU4501"
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


Just get the number of results using `_count` instead of `_search`
```
GET flight_tracking*/_count
{
  "query":{
    "bool": {
      "filter": {
        "term": {
          "callsign": "AZU4501"
        }
      }
    }
  }
}
```

Get some aggregation (metric and bucketed) for positions on the ground and for the last 30 minutes.
```
get flight_tracking*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "onGround": "true"
          }
        },
        {
          "range": {
            "timePosition": {
              "gte": "now-30m/m",
              "lte": "now/m"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "time_stats": {
      "stats": {
        "field": "timePosition"
      }
    },
    "avg_speed": {
      "avg": {
        "field": "velocity"
      }
    },
    "positions_over_time": {
      "date_histogram": {
        "field": "timePosition",
        "fixed_interval": "10m"
      }
    }
  }
}
```