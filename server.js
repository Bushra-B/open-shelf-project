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

//Add POST form data to request.body
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Set the view engine
// app.set('views', './views/pages');
// app.set('views', './views/pages/searches');
app.set('views', './views');
app.set('view engine', 'ejs');

//Handle any route
app.get('/', (request, response) => {
  response.status(200).send('Working');
});

//Temp route for testing
app.get('/test',(request,response) => {
  response.render('pages/index');
});

//Search page route
app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new');
});

//POST rquest route
app.post('/views/pages/searches', (request, response) => {
  let q = request.body.q;
  let searchBy = request.body.search;
  console.log('qs :', q);
  console.log('s :', searchBy);
  console.log('POST request: ', request.body);
  let dataArr;
  if (searchBy === 'title') {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${q}+intitle:${q}`;
    superagent.get(url)
      .then(searchResults => {
        let data = searchResults.body.items;
        dataArr = data.map(value => {
          new Book(value);
        });
        console.log('Results: ', dataArr);
        response.render('Results: ', dataArr);

      })
      .catch(error => {
        console.error(error);
      });
  } else if (searchBy === 'author') {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${q}+inauthor:${q}`;
    superagent.get(url)
      .then(searchResults => {
        let data = searchResults.body.items;
        dataArr = data.map(value => {
          new Book(value);
        });
        console.log('Results: ', dataArr);
        response.render('Results: ', dataArr);

      })
      .catch(error => {
        console.error(error);
      });
  }

});

let thumbnailImg = './book-icon-156.png';
const regex = /http/gi;

//C.F
function Book(bookData) {
  this.title = bookData.volumeInfo.title;
  this.author = bookData.volumeInfo.authors;
  this.description = bookData.volumeInfo.description ? bookData.volumeInfo.description : 'No Description Available';
  this.image = bookData.volumeInfo.imageLinks.thumbnail ? bookData.volumeInfo.imageLinks.thumbnail.replace(regex, 'https') : thumbnailImg;
}

//Listening on PORT
app.listen(PORT, () => {
  console.log('Listening on prot:', PORT);
});






