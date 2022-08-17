# Elasticsearch Geospatial Queries

## Search

Find documents in your index using geospatial conditions.

### Point and radius query

With the [`geo_distance`][geo_distance] query type get the positions near Barajas airport:

```
GET flight_tracking*/_search
{
  "query":{
    "geo_distance": {
      "distance": "5km",
      "location":{
        "lat": 40.469674,
        "lon":  -3.559828
      } } } }
```

**TIP**: you can use the website <http://bboxfinder.com> to get coordinates and bounding boxes.

### Bounding box query

Get the locations in the approximate [bounding box][bbox] of the JFK airport:

```
GET flight_tracking*/_search
{
  "query": {
    "bool": {
      "must": [ { "match_all": {} } ],
      "filter": {
        "geo_bounding_box": {
          "location": {
            "top_left": { "lat": 40.666, "lon": -73.824 },
            "bottom_right": { "lat": 40.620, "lon": -73.744 }
          } } } } } }
```

### Shape query

Let's find how many positions go over a [polygon][poly] that covers the city of Wuhan:

```
GET flight_tracking*/_count
{
  "query": {
    "bool": {
      "must": [
        {
          "match_all": {}
        }
      ],
      "filter": {
        "geo_shape": {
          "location": {
            "shape": """POLYGON((
              114.52 30.35,
              114.19 30.38,
              114.05 30.50,
              114.05 30.61,
              114.22 30.77,
              114.54 30.81,
              114.65 30.69,
              114.69 30.53,
              114.52 30.35))
            """
          } } } } } }
```



**TIP**: You can get quickly a polygon representation using [this tool][bbox_tool] and getting the `GeoJSON` output.


## Metric aggregations

### By bounding box

Let's find the bounding box of all positions where `countryOrigin` is Monaco using the [`geo_bounds`][geo_bounds] aggregation:

```
GET flight_tracking*/_search
{
  "size": 0, 
  "query": {
    "match": {
      "originCountry": "Italy"
    }
  },
  "aggs": {
    "viewport": {
      "geo_bounds": {
        "field": "location",
        "wrap_longitude": true
      }
    }
  }
}
```

### Centroid

Get the [centroids][centroids] of the top 5 Ryanair flights with more positions:

```
GET flight_tracking*/_search
{
  "size": 0, 
  "query": {
    "query_string": { "default_field": "callsign", "query": "RYR*" }
  },
  "aggs": {
    "centroids_by_callsign":{
      "terms": { "field": "callsign.keyword", "size": 5 },
      "aggs": {
        "cetroid": {
          "geo_centroid": { "field": "location" }
        } } } } }
```

**TIP**: yes, aggregations can be nested!!



### Geoline aggregation

This aggregation takes a group of points and returns the line that connects them given a sorting field. You usually want this aggregation to be combined with a filter or a terms aggregation to retrieve lines that connect the locations of a particular asset or grouped by an identifier like an airplane `callsign` field.

In this example we filter the last 15 minutes data for the airplane `JST574`, and the request the [line] aggregation representation using the `timePosition` field.

**IMPORTANT**: You need to adapt the `callsign` and the date filter values to your own data, using Discover or Maps.

```
GET flight_tracking_*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        {
          "range": { "timePosition": { "gte": "now-15m" }}
        },
        {
          "match_phrase": { "callsign": "JST574" }
        }
      ]
    }
  },
  "aggs": {
    "line": {
      "geo_line": {
        "point": {"field": "location"},
        "sort": {"field": "timePosition"}
      }
    }
  }
}
```



## Bucket aggregations

Group your query results using geospatial aggregations.

### Buffers

Group positions around CDG airport in [rings][rings] (also known as **buffers** in the geospatial world) of 10, 20, and 30 kilometers and return results using an object instead of an array:

```
GET flight_tracking*/_search
{
  "size": 0,
  "query": { "match_all": {} },
  "aggs": {
    "rings_around_cdg": {
      "geo_distance": {
        "field": "location",
        "origin": [ 2.561, 49.01 ],
        "unit": "km",
        "keyed": true,
        "ranges": [
          { "to": 10, "key": "<10km" },
          { "from": 10, "to": 20, "key": "10-20km" },
          { "from": 20, "to": 30, "key": "20-30km" }
        ]
      } } } }
```

### Tile grid

In the geospatial industry there is a common way to bucket the Earth using the square grid many online maps use. This schema uses a `Z/X/Y` notation that Elasticsearch can use to return your buckets.

Let's find the zoom level 6 buckets for positions in mainland France.

```
GET flight_tracking*/_search
{
  "size": 0,
  "query": { "match_all": {} },
  "aggregations": {
    "europe": {
      "filter": {
        "geo_shape": {
          "location": {
            "shape": { 
            "type": "Polygon",
            "coordinates": [[ 
              [ 3.315, 42.207 ],[ -2.332, 43.607 ],
              [ -5.166, 48.439 ],[ -1.98, 49.749 ],
              [ 1.975, 51.244 ],[ 8.478, 49.077 ],
              [ 6.567, 46.765 ],[ 7.973, 43.384 ],
              [ 3.315, 42.207 ]
              ]]
            }
          }
        }
      },
      "aggregations": {
        "zoom6": {
          "geotile_grid": {
            "field": "location",
            "precision": 6
          } } } } } }
```

**IMPORTANT**: Be careful with the `precision` parameter, a high value can potentially return **millions** of buckets, so you should only ask for high-precision results in a very small bounding box, or for small datasets.

**TIP**: You can get quickly a polygon representation using [this tool][bbox_tool] and getting the `GeoJSON` output.


### Hex grid

You can perform a similar query to the previous but instead of getting back buckets in the `Z/X/Y` schema, you get [hexagons] with the Uber's [h3] cell identifier. Same note about the `precision` parameter applies to this aggregation.

**TIP**: You may find [this viewer](https://wolf-h3-viewer.glitch.me/) useful to render the location of a given h3 cell id.

```
GET flight_tracking*/_search
{
  "size": 0,
  "query": { "match_all": {} },
  "aggregations": {
    "europe": {
      "filter": {
        "geo_shape": {
          "location": {
            "shape": { 
            "type": "Polygon",
            "coordinates": [[ 
              [ 3.315, 42.207 ],[ -2.332, 43.607 ],
              [ -5.166, 48.439 ],[ -1.98, 49.749 ],
              [ 1.975, 51.244 ],[ 8.478, 49.077 ],
              [ 6.567, 46.765 ],[ 7.973, 43.384 ],
              [ 3.315, 42.207 ]
              ]]
            }
          }
        }
      },
      "aggregations": {
        "h3_z3": {
          "geohex_grid": {
            "field": "location",
            "precision": 3
          } } } } } }
```



[geo_distance]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-distance-query.html
[bbox]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-bounding-box-query.html
[poly]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-shape-query.html
[bbox_tool]: https://boundingbox.klokantech.com/
[geo_bounds]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geobounds-aggregation.html
[centroids]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geocentroid-aggregation.html
[line]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geo-line.html
[rings]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geodistance-aggregation.html
[hexagons]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohexgrid-aggregation.html

[h3]: https://h3geo.org