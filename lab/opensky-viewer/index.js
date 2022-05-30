const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const config = require('./config');

const CONFIG = config.es_config || { node: process.env.ES_URL || 'http://elastic:changeme@localhost:9200/' }
const client = new Client(CONFIG);


const port = process.env.PORT || 8080;
const server = http.createServer(async function (request, response) {

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');

    if (request.url.startsWith('/tile')) {
        const urlParse = url.parse(request.url);
        const params = querystring.decode(urlParse.query);

        console.log(`Tile request: ${JSON.stringify(params)}`);

        // Precision level for aggregation cells. Accepts 0-8. Larger numbers result in smaller aggregation cells. If 0, results don’t include the aggs layer.
        let gridPrecision = 0;
        if (params.renderMethod === 'grid') {
            gridPrecision = 8;
        } else if (params.renderMethod === 'hex') {
            gridPrecision = 5;
        }

        const body = {
            exact_bounds: true,
            extent: 4096,
            grid_agg: params.renderMethod === 'grid' ? 'geotile' : 'geohex',
            grid_precision: gridPrecision,
            grid_type: 'grid',
            size: params.renderMethod === 'hits' ? 10000 : 0,// only populate the hits layer when necessary
            track_total_hits: false,
            query: params.searchQuery ? { //use Lucene query_string syntax
                "query_string": {
                    "query": params.searchQuery,
                    "analyze_wildcard": true
                }
            } : {
                "match_all": {}
            }
        }

        try {
            const tile = await client.searchMvt({
                index: params.index,
                field: params.geometry,
                zoom: parseInt(params.z),
                x: parseInt(params.x),
                y: parseInt(params.y),
                ...body,
            }, { meta: true });

            // set response header
            response.writeHead(tile.statusCode, {
                'content-disposition': 'inline',
                'content-length': 'content-length' in tile.headers ? tile.headers['content-length'] : `0`,
                'Content-Type': 'content-type' in tile.headers ? tile.headers['content-type'] : 'application/x-protobuf',
                'Cache-Control': `public, max-age=0`,
                'Last-Modified': `${new Date().toUTCString()}`,
            });

            // set response content
            response.write(tile.body);
            response.end();
        } catch (e) {
            console.error(e);
            response.writeHead('statusCode' in e ? e.statusCode : 500);
            response.write(e?.meta?.body ? JSON.stringify(e?.meta?.body) : '');
            response.end();
        }
    } else if (request.url === '/'){
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(fs.readFileSync('./index.html'));
        response.end('');
    } else {
        response.writeHead(404);
        response.write('Page does not exist')
        response.end();
    }
});

server.listen(port);
console.log(`Tile server running on port ${port}`);
