'use strict';

//Load enviroument variables
require('dotenv').config();

//Server dependencies
const express = require('express');
const superagent = require('superagent');

//Initial server setup
const app = express();
const PORT = process.env.PORT || 3030;

//Specify a directory for static resourses
app.use(express.static('./public'));

//Set the view engine
app.set('views', './views/pages');
app.set('view engine', 'ejs');

//Handle any route
app.get('/', (request, response) => {
  response.status(200).send('Working');
});

//Temp route for testing
app.get('/test',(request,response)=>{
  response.render('index');
});



//Listening on PORT
app.listen(PORT, () => {
  console.log('Listening on prot:', PORT);
});






