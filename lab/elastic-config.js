const fs = require('fs');

const default_node = 'https://es01:9200';

const node = process.env.ELASTIC_HOST || default_node;
const password = process.env.ELASTIC_PASSWORD || 'changeme';

const opensky_user = process.env.OPENSKY_USER;
const opensky_password = process.env.OPENSKY_PASSWORD;

const tls = (node === default_node) ?
    {
        ca: fs.readFileSync('/etc/ssl/opensky/ca/ca.crt'),
        rejectUnauthorized: true
    } : null

module.exports = {
    es_config: {
        node,
        auth: {
            username: 'elastic',
            password
        },
        tls
    },
    index_name: 'flight_tracking',
    sleep_seconds: 90,
    opensky: {
        user: opensky_user,
        password: opensky_password,
        url: 'https://opensky-network.org/api/states/all'
    }
};

