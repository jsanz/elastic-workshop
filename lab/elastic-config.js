const fs = require('fs');

const default_node = 'https://es01:9200';

const node = process.env.ELASTIC_HOST || default_node;
const password = process.env.ELASTIC_PASSWORD || 'changeme';

const tls = (node === default_node) ?
    {
        ca: fs.readFileSync('/usr/share/app/certs/ca/ca.crt'),
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
    sleep_seconds: 60
};

