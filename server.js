'use strict';

//Load enviroument variable
require('dotenv').config();

//Server Dependencies
const express = require('express');
const superagent = require('superagent');

//Initial server setup
const app = express();
const PORT = process.env.PORT || 3030;

//Specigy static resourses directory
app.use(express.static('./public'));

//Express middleware - Add POST form data to request.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Set the view engine
app.set('views', './views');
app.set('view engine', 'ejs');

//Handle any route
app.get('/', (request, response) => {
  response.status(200).send('Working');
});

//Temo route for testing
app.get('/test', (request, response) => {
  response.render('pages/index');
});

//Routes
app.get('/searches/new', searchHandler); //Search page
app.post('/searches', getData); //Form POST request

//Handling search page route
function searchHandler(request, response) {
  response.render('pages/searches/new');
}

//Handling POST request route
function getData(request, response) {
  let q = request.body.q;
  let searchBy = request.body.search;
  console.log('qs :', q);
  console.log('s :', searchBy);
  console.log('POST request: ', request.body);
  let dataArr;
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (searchBy === 'title') {
    url += `${q}+intitle:${q}`;
  }
  else if (searchBy === 'author') {
    url += `${q}+inauthor:${q}`;
  }
  superagent.get(url)
    .then(searchResults => {
      let data = searchResults.body.items;
      dataArr = data.map(value => {
        let book = new Book(value);
        return book;
      });
      console.log('Results: ', dataArr);
      response.render('pages/searches/show', {dataArr: dataArr});
    })
    .catch(error => {
      console.error(error);
      response.render('pages/error');
    });
}

let thumbnailImg = 'https://www.freeiconspng.com/uploads/book-icon-black-good-galleries--24.jpg';
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

