'use strict'

const { Client } = require('@elastic/elasticsearch');
const rp = require('request-promise-native');
const config = require('./config');

const CONFIG = config.es_config || { node: 'http://localhost:9200'}
const INTERVAL_SECS = config.sleep_seconds || 60;
const ES_INDEX_NAME = config.index_name || 'flight_tracking';

const client = new Client(CONFIG);

function checkConnection() {
    return new Promise(async (resolve) => {
      console.log("Checking connection to ElasticSearch...");
      let isConnected = false;
      while (!isConnected) {
        try {
          await client.cluster.health({});
          console.log("Successfully connected to ElasticSearch");
          isConnected = true;
          sleep(1000);
        } catch (_) {
        }
      }
      resolve(true);
    });
  }

async function loadFlights () {
  console.log('---- OPENSKY CONFIG ----');
  console.log(config);
  console.log('---- OPENSKY CONFIG ----');

  await checkConnection();

  // Create the index if necessary
  const doesIndexExistResp = await client.indices.exists({
    index: ES_INDEX_NAME,
  });
  if (!doesIndexExistResp.body) {
    createIndex();
  }

  // Infinite loop to load the resources
  while(true) {
    try {
      await indexFlights(await getFlights());
    } catch (error) {
      console.log('There was an error')
    }
    await sleep(INTERVAL_SECS * 1000);
  }
}

function sleep(ms) {
  console.log(`Sleeping for ${ms / 1000} seconds`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createIndex() {
  console.log(`Creating index ${ES_INDEX_NAME}`);
  await client.indices.create({
    index: ES_INDEX_NAME,
    body: {
      settings: { index: { number_of_shards: 1, auto_expand_replicas: '0-1' } },
      mappings: {
        properties: {
          icao24: { type: 'keyword' },
          callsign: { type: 'keyword' },
          originCountry: { type: 'keyword' },
          location: { type: 'geo_point' },
          timePosition: { type: 'date' },
          lastContact: { type: 'date' },
          '@timestamp': { type: 'date' },
          baroAltitude: { type: 'float' },
          onGround: { type: 'boolean' },
          velocity: { type: 'float' },
          verticalRate: { type: 'float' },
          'heading': { type: 'float' },
          geoAltitude: { type: 'float' },
          transponderCode: { type: 'keyword' },
          spi: { type: 'boolean' },
          positionSource: { type: 'integer' }
        }
      },
    },
  });
}

async function indexFlights(flights) {
  console.log(`Indexing ${flights.length} flights into ${ES_INDEX_NAME}`);

  const bulk = [];
  flights.forEach(async (fligh) => {
    bulk.push({ index: { _index: ES_INDEX_NAME } });
    bulk.push(fligh);
  });

  const resp = await client.bulk({ body: bulk });

  if (resp.errors) {
    console.log(`Failed to load some flights`);
  }
}

async function getFlights () {
  console.log(`Fetching flights @ ${(new Date()).toISOString()}`);

  const options = {
    uri: 'https://opensky-network.org/api/states/all',
    headers: { 'User-Agent': 'Request-Promise' },
    json: true
  };
  const response = await rp(options);

  console.log(`Fetched ${response.states.length} flights`);

  return response.states.map(convertStateToFlight);
}

function convertStateToFlight(state) {
  // state is an array, see 'All State Vectors' @ https://opensky-network.org/apidoc/rest.html for details
  const flight = {
    ['@timestamp']: Date.now(),
    onGround: state[8],
    spi: state[15], // Whether flight status indicates special purpose indicator
  };
  if (state[0]) {
    flight.icao24 = state[0];
  }
  if (state[1]) {
    flight.callsign = state[1];
  }
  if (state[2]) {
    flight.originCountry = state[2];
  }
  if (state[3]) {
    // provided in seconds, convert to milliseconds so ES will convert to Date
    flight.timePosition = state[3] * 1000;
  }
  if (state[4]) {
    // provided in seconds, convert to milliseconds so ES will convert to Date
    flight.lastContact = state[4] * 1000;
  }
  if (state[5] && state[6]) {
    flight.location = { lat: state[6], lon: state[5] };
  }
  if (state[7]) {
    flight.baroAltitude = state[7];
  }
  if (state[9]) {
    flight.velocity = state[9];
  }
  if (state[10]) {
    // decimal degrees clockwise from north (north=0°)
    flight.heading = state[10];
  }
  if (state[11]) {
    // Vertical rate in m/s. A positive value indicates that the airplane is climbing, a negative value indicates that it descends
    flight.verticalRate = state[11];
  }
  if (state[13]) {
    // Geometric altitude in meters
    flight.geoAltitude = state[13];
  }
  if (state[14]) {
    flight.transponderCode = state[14];
  }
  if (state[16]) {
    flight.positionSource = state[16];
  }

  return flight;
}

loadFlights().catch(console.log);
