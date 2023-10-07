const express = require('express')
const crypto = require('node:crypto')
const fs = require('node:fs');
const snowflake = require('snowflake-sdk')

const privateKeyFile = fs.readFileSync('./keys/pkcs8.priv')

const privateKeyObject = crypto.createPrivateKey({
    key: privateKeyFile,
    format: 'pem',
    passphrase: 'plock' // TODO: move to env var
});

const privateKey = privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8'
});

const connection = snowflake.createConnection({
    authenticator: "SNOWFLAKE_JWT",
    privateKey: privateKey,

    username: 'PATRYKBAJOS',
    account: 'JJZMTVV-NG83636',
    role: 'ACCOUNTADMIN',
    warehouse: 'COMPUTE_WH',
    database: 'KRAJOBRAZ_PLOCK',
    schema: 'KRAJOBRAZ'
});

let addresses = [];

connection.connect(function (err, conn) {
    if(err) {
        console.log('Error connecting to Snowflake')
        console.log(err)
        process.exit(-1)
    }
    else {
        console.log('Successfully connected to Snowflake.');

        connection.execute({
            sqlText: 'SELECT * FROM KRAJOBRAZ_PLOCK.KRAJOBRAZ.ADRESY_STREFA_UK;',
            complete: function (err, stmt, rows) {
                if(err) {
                    console.log('Error retrieving adresses from Snowflake!');
                    console.log(err);
                    process.exit(-1);
                }
                else {
                    addresses = rows;
                    console.log('Succesfully retrieved ' + rows.length + ' addresses.');
                }
            }
        });
    }
});

const app = express()
const port = 3000;

app.get('/health', (req, res) => {
    res.send('OK')
})

app.get('/addresses', (req, res) => {
    const street = req.query.street;
    const nb = req.query.nb;

    if(!street || !nb) {
        res.json(addresses);
    }
    else {
        res.json(addresses.filter(elem => {
            return (elem.ULIC_NAZWA === street) && (elem.NUMER == nb)
        }))
    }
})

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`)
})
