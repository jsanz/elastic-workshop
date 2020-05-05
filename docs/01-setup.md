# Laboratory

## Elastic Stack set up

There are three ways to set up the Elastic Stack for this laboratory:

* Create a trial account with the [Elastic Cloud][1]
* Use Docker Composer to start the stack locally
* Run manually Elasticsearch and Kibana on your computer

### Set up: Elastic Stack with [Elastic Cloud][1]

This is the easiest way to start this lab, simply create a new account at the [Elastic Cloud][1] and start a deployment. You can leave the default settings. Once you have the cluster up and running you need to save three important settings: 

* Cloud ID
* Username, should be `elastic` by default
* Password, you need to store this string somewhere since it's presented only once, but you can regenerate it anytime

From the deployment page you can also get your endpoint URLs for Kibana and Elastic.

![](images/deployment.png)

You have a full guide on how to set up the trial on the [Elastic Cloud Getting Started][2] page.

### Set up: Docker Compose

On the `/lab` folder you have a `docker-compose.yaml` file with the definition of all the services for this lab. First time you run it will take some minutes since it needs to download all the images, so maybe you'll want to run `docker-compose up --no-start` from a location with good bandwidth *before* the workshop to ensure you have all the docker images installed.

To start the Elastic Stack services you can run `docker-compose start workshop-elasticsearch workshop-kibana` and then check their status with `docker-compose ps` and `docker-compose logs -f`.

### Set up: Local installation

You can download both Elasticsearch and Kibana from <https://www.elastic.co/start> and follow the simple instructions: just download and run both services.

## Getting [Open Sky][3] data into Elastic

Apart from having access to a Elastic Stack (both Elasticsearch and Kibana), you need data to explore them so we are going to load flights data in real time from the [Open Sky Network][3] using a simple nodejs script at the `opensky-loader` folder. Depending on how you access the stack the script should be adapted minimally. The script can also be run in two different ways, if you have a Node development environment then you can run it locally, but if you don't have it you can use Docker Compose also to run this script.

### Configuration

Inside the `lab/opensky-loader/config` you need a `index.js` file with some settings:

* Elasticsearch client configuration
* Name of the index for your data
* How often you want to retrieve the data from OpenSky API (every 60 seconds is more than fine)

You only need to adapt the Elasticsearch configuration, that will differs depending if you are running in Elastic Cloud, Docker Compose, or Local.

From **Cloud** your `index.js` will look like this:

```js
module.exports = {
    es_config: {
        cloud:{
            id: 'yor_very_long_cloud_id'
        },
        auth: {
            username: 'elastic',
            password: 'your_elastic_password'
          }
    },
    index_name: 'flight_tracking',
    sleep_seconds: 60
};
```

From **Docker Compose** (this is the default setting):

```js
module.exports = {
    es_config: {
        node: 'http://workshop-elasticsearch:9200/',
    },
    index_name: 'flight_tracking',
    sleep_seconds: 60
};
```

From **`localhost`**:

```js
module.exports = {
    es_config: {
        node: 'http://localhost:9200',
    },
    index_name: 'flight_tracking',
    sleep_seconds: 60
};
```

### Running the script

If you have docker compose, independently of how you are running the rest of the stack, you can run the script with:

```sh
$ docker-compose start opensky-loader
```

If you prefer to run the script directly you just need to go to the `opensky-loader` folder and run:

```sh
$ npm start
```

### Confirmation

The easiest way to check if your data is coming is going to the Kibana DevTools application and run this query

```
GET /flight_tracking*/_count
```

```
{
  "count" : 214847,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  }
}
```
![](images/kibana-dev-tools.png)



[1]: https://www.elastic.co/cloud/elasticsearch-service/signup
[2]: https://www.elastic.co/guide/en/cloud/current/ec-getting-started.html
[3]: https://opensky-network.org/