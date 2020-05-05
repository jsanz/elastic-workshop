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


[c]: https://curl.haxx.se/
[o]: https://gdal.org/programs/ogr2ogr.html
[j]: https://stedolan.github.io/jq/
[u]: https://www.elastic.co/guide/en/kibana/current/geojson-upload.html