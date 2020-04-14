'use strict';

//Load enviroument variable
require('dotenv').config();

//Server Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

//Initial server setup
const app = express();
const PORT = process.env.PORT || 3030;

//Specigy static resourses directory
app.use(express.static('./public'));

//Express middleware - Add POST form data to request.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Connect with database
const client = new pg.Client(process.env.DATABASE_URL);

//Set the view engine
app.set('views', './views');
app.set('view engine', 'ejs');

//**************************************/
//Handle any route
// app.get('/', (request, response) => {
//   response.status(200).send('Working');
// });

// //Temo route for testing
// app.get('/test', (request, response) => {
//   response.render('pages/index');
// });
//*********************************************/

//Routes
app.get('/', homepageHandler); //Home page
app.get('/searches/new', searchHandler); //Search page
app.post('/searches', getData); //Form POST request
app.get('/books/:book_id', detailsHandler);
app.post('/books', toDatabase);

//Handling home page route
function homepageHandler(request, response) {
  response.redirect('/index');
}
app.get('/index', (request, response) => {
  const SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => {
      response.render('pages/index', {books: results.rows});
      console.log('coming from database');
    });
});
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
    .then(results => {
      let data = results.body.items;
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
  this.isbn=bookData.volumeInfo.industryIdentifiers[0].type;
}

//Handling details route
function detailsHandler(request, response) {
  let id = [request.params.book_id];
  console.log(id);
  let SQL = `SELECT * FROM books WHERE id = $1;`;
  let safeValue = [id];
  return client.query(SQL, safeValue)
    .then(results => {
      response.render('pages/books/show', { details: results.rows[0] })

    });
}

//Handling books route - Saving to DB
function toDatabase(request, response) {
  let length;
  let { author, title, isbn, image_url, description ,bookshelf} = request.body;
  console.log(request.body);
  const SQL1 = 'INSERT INTO books (author,title,isbn,image_url,description,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  const safeValues = [author, title, isbn, image_url, description, bookshelf];
  const SQL2 = 'SELECT * FROM books;';
  client.query(SQL2)
    .then(results => {
      length=results.rows.length;
    });
  return client.query(SQL1, safeValues)
    .then(() => {
      response.redirect(`/books/${length+1}`);
    });
}

//Starting server after connecting to DB
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT: ${PORT}`)
    });
  });
