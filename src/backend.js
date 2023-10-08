const express = require('express')
const crypto = require('node:crypto')
const fs = require('node:fs');
const snowflake = require('snowflake-sdk')
const cors = require('cors')

const privateKeyFile = fs.readFileSync('./keys/pkcs8.priv')

const privateKeyObject = crypto.createPrivateKey({
    key: privateKeyFile,
    format: 'pem',
    passphrase: 'plock'
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

 connection.connect(function (err, conn) {
    if(err) {
        console.log('Error connecting to Snowflake')
        console.log(err)
        process.exit(-1)
    }
    else {
        console.log('Successfully connected to Snowflake.');
    }
});

const app = express()
app.use(cors())
const port = 3000;

app.get('/health', (req, res) => {
    res.send('OK')
})

app.get('/addresses', (req, res) => {
    const street = req.query.street;
    const nb = req.query.nb;

    if(!street || !nb) {
        connection.execute({
            sqlText: `SELECT * FROM KRAJOBRAZ_PLOCK.KRAJOBRAZ.ADRESY_STREFA_UK;`,
            complete: function (err, stmt, rows) {
                if(err) {
                    console.log('Error retrieving adresses from Snowflake!');
                    console.log(err);
                    res.json([]);
                }
                else {
                    console.log('Succesfully retrieved ' + rows.length + ' addresses.');
                    res.json(rows);
                }
            }
        });
    }
    else {
        connection.execute({
            sqlText: 'SELECT * FROM KRAJOBRAZ_PLOCK.KRAJOBRAZ.ADRESY_STREFA_UK WHERE ULIC_NAZWA=? AND NUMER=?;',
            binds: [street, nb],
            complete: function (err, stmt, rows) {
                if(err) {
                    console.log('Error retrieving adresses from Snowflake!');
                    console.log(err);
                    res.json([]);
                }
                else {
                    console.log('Succesfully retrieved ' + rows.length + ' addresses.');
                    res.json(rows);
                }
            }
        });
    }
})

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`)
})
