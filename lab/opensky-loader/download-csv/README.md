# OpenSky CSV Downloader

Use the script `download.sh` along with `curl` and `jq` to download a CSV file for as long as you want. The script makes a request to OpenSky API and appends to a CSV file the contents, waits for 60 seconds and repeat. The CSV will be named using a date scheme so you can run the process several times without loosing any observations.

This CSV can then be uploaded to Elastic using the Machine Learning Data Visualizer CSV Import tool. You need to specify the following mapping and pipeline definition in order to ingest the rows properly.


Mapping:

```
{
  "@timestamp": {"type": "date"},
  "lastContact": {"type": "date", "format": "epoch_second"},
  "timePosition": {"type": "date", "format": "epoch_second"},
  "baroAltitude": {"type": "double"},
  "callsign": {"type": "keyword"},
  "country": {"type": "keyword"},
  "geoAltitude": {"type": "double"},
  "heading": {"type": "double"},
  "icao24": {"type": "keyword"},
  "latitude": {"type": "double"},
  "longitude": {"type": "double"},
  "onGround": {"type": "boolean"},
  "positionSource": {"type": "long"},
  "spi": {"type": "boolean"},
  "transponderCode": {"type": "keyword"},
  "velocity": {"type": "double"},
  "verticalRate": {"type": "double"},
  "location": {"type": "geo_point"},
  "_": {"type": "keyword"} 
}
```

Pipeline:


```
{
  "description": "Ingest pipeline for OpenSky CSV",
  "processors": [
    {
      "date": {
        "field": "lastContact",
        "formats": ["UNIX"],
        "ignore_failure": true
      }
    },
    {
      "date": {
        "field": "timePosition",
        "formats": ["UNIX"]
      }
    },
    {
      "trim": {
        "field": "callsign",
        "ignore_failure": true
      }
    },
    {
      "script": {
        "source": "ctx.location = ctx.latitude + ',' +  ctx.longitude;",
        "ignore_failure": true
      }
    },
    {
      "remove": {
        "field": ["_","latitude","longitude"],
        "ignore_missing": true,
        "ignore_failure": true
      }
    }
  ]
}
```

### Mapping
