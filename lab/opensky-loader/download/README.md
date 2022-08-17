# OpenSky Data Downloader

Use the script `download.sh` along with [`curl`][c], [`jq`][j], and [`ogr2ogr`][o] to download and generate CSV and GeoJSON files. The script takes a single parameter with the number or requests to the API you want to do, using `5` as a default value.

The script makes a request to OpenSky API and appends to a CSV file the contents, waits for 60 seconds and repeat. The CSV will be named using a date scheme so you can run the process several times without loosing any observations. 

Once the file is generate it will use `ogr2ogr` to convert the CSV into a GeoJSON file you can upload to Elasticsearct using Elastic Maps [GeoJSON Upload][u].

Sample execution:

```
$ bash download.sh 2
Iterating 2 times
Writing to flight_tracking_2020-02-05_18_42.csv
[1] Downloading... (mié feb  5 18:42:03 CET 2020)
Done, sleeping 60 seconds
[2] Downloading... (mié feb  5 18:43:12 CET 2020)
Finished downloading
Generating the GeoJSON file: flight_tracking_2020-02-05_18_42.geojson
```

## Upload the CSV

If you want to have all the fields correctly mapped you can use the [Kibana File Upload](https://www.elastic.co/guide/en/kibana/current/connect-to-elasticsearch.html#upload-data-kibana) to process the `CSV` file instead of the `GeoJSON` output.

Once the file is initially processed, use these mappings and ingest pipeline definition in the **Advanced** tab

### Mappings

```json
{
  "properties": {
    "@timestamp": {
      "type": "date"
    },
    "_": {
      "type": "keyword"
    },
    "baroAltitude": {
      "type": "double"
    },
    "callsign": {
      "type": "keyword"
    },
    "country": {
      "type": "keyword"
    },
    "geoAltitude": {
      "type": "double"
    },
    "heading": {
      "type": "double"
    },
    "icao24": {
      "type": "keyword"
    },
    "lastContact": {
      "type": "date",
      "format": "epoch_second"
    },
    "timePosition": {
      "type": "date",
      "format": "epoch_second"
    },
    "latitude": {
      "type": "float"
    },
    "longitude": {
      "type": "float"
    },
    "onGround": {
      "type": "boolean"
    },
    "positionSource": {
      "type": "keyword"
    },
    "spi": {
      "type": "boolean"
    },
    "transponderCode": {
      "type": "keyword"
    },
    "velocity": {
      "type": "double"
    },
    "verticalRate": {
      "type": "double"
    },
    "location": {
      "type": "geo_point"
    }
  }
}
```

### Ingest pipeline

```json
{
  "description": "Ingest pipeline created by text structure finder",
  "processors": [
    {
      "csv": {
        "field": "message",
        "target_fields": [
          "icao24",
          "callsign",
          "country",
          "timePosition",
          "lastContact",
          "longitude",
          "latitude",
          "baroAltitude",
          "onGround",
          "velocity",
          "heading",
          "verticalRate",
          "_",
          "geoAltitude",
          "transponderCode",
          "spi",
          "positionSource"
        ],
        "ignore_missing": false
      }
    },
    {
      "date": {
        "field": "timePosition",
        "formats": [
          "UNIX"
        ]
      }
    },
    {
      "convert": {
        "field": "baroAltitude",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "geoAltitude",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "heading",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "date": {
        "field": "lastContact",
        "formats": [
          "UNIX"
        ]
      }
    },
    {
      "convert": {
        "field": "latitude",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "longitude",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "onGround",
        "type": "boolean",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "spi",
        "type": "boolean",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "velocity",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "convert": {
        "field": "verticalRate",
        "type": "double",
        "ignore_missing": true
      }
    },
    {
      "set": {
        "field": "location",
        "value": "{{latitude}},{{longitude}}"
      }
    },
    {
      "remove": {
        "field": "message"
      }
    },
    {
      "remove": {
        "field": "_"
      }
    },
    {
      "remove": {
        "field": "latitude"
      }
    },
    {
      "remove": {
        "field": "longitude"
      }
    }
  ]
}
```



[c]: https://curl.haxx.se/
[o]: https://gdal.org/programs/ogr2ogr.html
[j]: https://stedolan.github.io/jq/
[u]: https://www.elastic.co/guide/en/kibana/current/geojson-upload.html