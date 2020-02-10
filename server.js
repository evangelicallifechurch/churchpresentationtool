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
    <select id="template">
      <option value="1">1</option>
      <option value="2">2</option>
    </select>
    
    <input id="reference" type="text" placeholder="reference" value="Иоанна 3:16"/>
    <input id="verse" type="text" placeholder="verse" value="Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную."/>
    
    <button onclick="send()">Send</button>
    
    <script>
      
      function send() {
        const template = document.getElementById('template').value;
        const reference = document.getElementById('reference').value;
        const verse = document.getElementById('verse').value;
        console.log(template, reference, verse);
        
        fetch('/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template: template,
            reference: reference,
            verse: verse
          })
        });

      }
    </script>
  `);
  });

  app.post('/', (request, response) => {

    const ws = new WebSocket(`ws://${ip.address()}:3001/`);

    console.log(request.body);

    const template = request.body.template;
    const reference = request.body.reference;
    const verse = request.body.verse;

    // console.log(html);

    // Change template by id

    ws.onerror = function (err) {
      console.error('failed to make websocket connection');
      throw err;
    };

    ws.onopen = function () {

      const templates = [
        '<p id="reference"><%= reference %></p><p><%= verse %></p>',
        '<p id="verse"><%= reference %></p><h1><%= verse %></h1>'
      ];

      console.log('connection established');
      ws.send(ejs.render(templates[template - 1], {reference: reference, verse: verse}));
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

      // Api
      app.get('/api/books/:id', (request, response) => {
        const BookId = Number(request.params.id);
        const book = db.get('Books').find({BookId: BookId}).value();
        // console.log(book);
        response.json(book);
      });

    });

  app.listen(3000, () => console.log('listening on port ' + port))

}());
