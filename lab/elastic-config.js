const fs = require('fs');

const password = process.env.ELASTIC_PASSWORD || 'changeme';

module.exports = {
    es_config: {
        node: 'https://es01:9200',
        auth: {
            username: 'elastic',
            password
        },
        tls: {
          ca: fs.readFileSync('/usr/share/app/certs/ca/ca.crt'),
          rejectUnauthorized: true
        }
    },
    index_name: 'flight_tracking',
    sleep_seconds: 60
};
