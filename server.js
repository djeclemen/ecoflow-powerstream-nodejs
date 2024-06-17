var path = require('path');
var express = require('express');
var dotenv = require('dotenv');
dotenv.config();
const port = 8000;
const key = "/?" + process.env.KEY_QUERY + "="
const app = express();
const url = process.env.KEY_URL;
const { log } = require("./utils");
let mqttDaten = {};

app.get('/' + url, (req, res) => {
  if (process.env.TOKEN && req.query[process.env.TOKEN] && (req.query[process.env.TOKEN] === process.env.TOKEN_VAL)) {
    let v = req.query[process.env.KEY_QUERY_AC];
    let v2 = req.query[process.env.KEY_QUERY_PRIO];
    let v3 = req.query[process.env.TARGET];
    //console.log(v,v2);
    if (process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN && (v || v2)) {
      if (req.query[process.env.KEY_QUERY_AC] || req.query[process.env.KEY_QUERY_PRIO]) {
        const { getEcoFlowMqttData, setupMQTTConnection, setAC, setPrio } = require(path.resolve(__dirname, "./ecoflow.js"));
        getEcoFlowMqttData(process.env.KEY_MAIL, process.env.KEY_PASSWORD)
          .then(mqttDaten => {
            if (mqttDaten) {
              log('received data from Ecoflow MQTT broker', mqttDaten);
              setupMQTTConnection(mqttDaten)
                .then(client => {
                  client.on('connect', function () {
                    log('connected to Ecoflow MQTT broker');
                    client.subscribe(['#'], () => {
                      log('Subscribed to Ecoflow MQTT topic #');
                    });

                    if (v && v * 1 >= 0) {
                      if (v3 == 2) {
                        setAC(client, process.env.KEY_POWERSTREAM_SN2, v * 10);
                      } else {
                        setAC(client, process.env.KEY_POWERSTREAM_SN, v * 10);
                      }
                    } else {
                      log(process.env.KEY_QUERY_AC + ' must be greater than 0');
                    }
                    if (v2 && (v2 * 1 === 0 || v2 * 1 === 1)) {
                      if (v3 == 2) {
                        setPrio(client, process.env.KEY_POWERSTREAM_SN2, v2);
                      } else {
                        setPrio(client, process.env.KEY_POWERSTREAM_SN, v2);
                      }
                    } else {
                      log(process.env.KEY_POWERSTREAM_SN + ' must be 0 or 1');
                    }
                    setTimeout(() => {
                      log('disconnecting from Ecoflow MQTT broker');
                      client.end();
                      res.status(200).send('Operation completed successfully'); // Sending success response here
                    }, "3000");
                  });
                })
                .catch((err) => {
                  log('Error in MQTT setup or operations', err);
                  res.status(500).send('Error in MQTT setup or operations');
                });
            } else {
              log('Not connected to Ecoflow MQTT broker');
              res.status(500).send('Not connected to Ecoflow MQTT broker');
            }
          })
          .catch((err) => {
            log('Error in fetching MQTT data', err);
            res.status(500).send('Error in fetching MQTT data');
          });
      } else {
        log(process.env.KEY_QUERY_AC + ' or ' + process.env.KEY_QUERY_PRIO + ' are mandatory');
        res.status(400).send(process.env.KEY_QUERY_AC + ' or ' + process.env.KEY_QUERY_PRIO + ' are mandatory');
      }
    } else {
      log(process.env.KEY_PASSWORD + ' are mandatory');
      res.status(400).send(process.env.KEY_PASSWORD + ' are mandatory');
    }
  } else {
    log(process.env.TOKEN + ' are mandatory');
    res.status(401).send(process.env.TOKEN + ' are mandatory');
  }
});

app.use((req, res) => { res.status(404).send('Not found!') });

var server = app.listen(port, () => {
  var host = server.address().address;
  var port = server.address().port;

  log("Starting app listening at port " + port);
});
