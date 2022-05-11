const fs = require('fs');

module.exports = {
    es_config: {
        node: 'https://es01:9200',
        auth: {
            username: 'elastic',
            password: 'changeme'
        },
        tls: {
          ca: fs.readFileSync('/usr/share/app/certs/ca/ca.crt'),
          rejectUnauthorized: true
        }
    },
    index_name: 'flight_tracking',
    sleep_seconds: 60
};
