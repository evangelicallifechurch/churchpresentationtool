(function () {

  const express = require('express');
  const app = express();
  const port = 3000;

  // const path = require('path');

  // For database
  const low = require('lowdb');
  const FileAsync = require('lowdb/adapters/FileAsync');


  // For files
  const fs = require("fs");

  // For ip address
  const ip = require('ip');

  // Ejs
  const ejs = require('ejs');

  // Body-parser
  const bodyParser = require('body-parser');

  // For websocket
  const WebSocket = require('ws');

  // For requests to api
  const axios = require('axios');

  // For middleware
  const router = express.Router();

  // Openning a websocket server
  const wss = new WebSocket.Server({port: 3001});
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });

  app.use(bodyParser.json()); // support json encoded bodies
  app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

  app.get('/', (request, response) => {
    response.send(`
    Шаблон
    <select id="template_id">
      <option value="1">1</option>
      <option value="2">2</option>
    </select>
    
    <input id="reference" type="text" placeholder="reference" value="Иоанна 3:16"/>
    <input id="verse" type="text" placeholder="verse" value="Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную."/>
    
    <button onclick="send()">Send</button>
    
    <script>
      
      function send() {
        const template_id = document.getElementById('template_id').value;
        const reference = document.getElementById('reference').value;
        const verse = document.getElementById('verse').value;
        console.log(template_id, reference, verse);
        
        fetch('/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_id: template_id,
            reference: reference,
            verse: verse
          })
        });

      }
    </script>
  `);
  });

  router.use('/', (request, response, next) => {
    axios.get(`http://${ip.address()}:3000/api/templates/${request.body.template_id}`)
      .then(response => {
        console.log(response.data);
        // Return template
        request.template = response.data.template;
        next();
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });
  });

  app.post('/', router, (request, response) => {

    const ws = new WebSocket(`ws://${ip.address()}:3001/`);

    console.log('request.body ->', request.body);
    console.log('request.template ->', request.template);

    // Get template from middleware
    const template = request.template;

    // Get reference and verse from request
    const reference = request.body.reference;
    const verse = request.body.verse;

    ws.onopen = function () {
      console.log('connection established');
      // Send rendered template with all to client
      ws.send(ejs.render(template, {reference: reference, verse: verse}));
    };

    ws.onerror = function (err) {
      console.error('failed to make websocket connection');
      throw err;
    };

    response.status(404).send("Sorry can't find that!");
  });

  app.get('/:id', function (request, response) {
    response.send(`
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <script>
        const ws = new WebSocket(\`ws://${ip.address()}:3001/\`);
    
        ws.onerror = function (err) {
          console.error('failed to make websocket connection');
          throw err;
        };
        
        ws.onopen = function () {
          console.log('connection established');
        };
        
        ws.onmessage = function (event) {
          console.log(event.data);
          document.body.innerHTML = event.data;
        };
      </script>
      `);
  });

  // Create database instance and start server
  const adapter = new FileAsync(__dirname + '/' + 'database.json');
  low(adapter)
    .then(db => {

      // Book
      app.get('/api/books/:id', (request, response) => {
        const BookId = Number(request.params.id);
        const book = db.get('Books').find({BookId: BookId}).value();
        // console.log(book);
        response.json(book);
      });

      // Template
      app.get('/api/templates/:id', (request, response) => {
        const id = Number(request.params.id);
        const book = db.get('templates').find({template_id: id}).value();
        response.json(book);
      });

    });

  app.listen(3000, () => console.log('listening on port ' + port))

}());
