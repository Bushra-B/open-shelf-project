'use strict';

//Load enviroument variable
require('dotenv').config();

//Server Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverRide = require('method-override');

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

//Use method override
app.use(methodOverRide('_method'));

//Routes
app.get('/', homepageHandler); //Home page
app.get('/index', homepageHandler);
app.get('/searches/new', searchHandler); //Search page
app.get('/books/:bookID', detailsHandler);
app.post('/books', toDatabase);
app.get('*', notFoundHandler);

//Handling home page route
function homepageHandler(request, response) {
  const SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(result => {
      response.render('./pages/index', { data: result.rows });
    });
}
//Handling search page route
function searchHandler(request, response) {
  response.render('pages/searches/new');
}
app.post('/searches', (request, response) => {
  const inputt = request.body.search;
  const radio = request.body.radio;
  console.log(radio);
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (radio === 'title') {
    url += `${inputt}+intitle:${inputt}`;
  }
  else if (radio === 'author') {
    url += `${inputt}+inauthor:${inputt}`;
  }
  superagent.get(url)
    .then(bookData => {
      let dataArray = bookData.body.items.map(value => {
        return new Book(value);
      });
      response.render('./pages/searches/show', { data: dataArray });
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });
});

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
  let saveId = [request.params.bookID];
  // console.log(saveId);
  let sql = `SELECT * FROM books WHERE id = $1;`
  let SQL2 = 'SELECT DISTINCT bookshelf FROM books;'
  let arrOfBookSh=[];
  client.query(SQL2)
    .then(result=>{
      arrOfBookSh=result.rows;
    });
  return client.query(sql, saveId)
    .then(result => {
      response.render('./pages/books/show', { data: result.rows[0] , arrOfBookSh : arrOfBookSh });
    });
}

//Handling books route - Saving to DB
function toDatabase(request, response) {
  let ln;
  let title2 = request.body.title;
  let { author, title, isbn, image_url, description ,bookShelf} = request.body;
  // console.log(req.body);
  let SQL = 'INSERT INTO books (author,title,isbn,image_url,description,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  let safeValues = [author,title,isbn,image_url, description,bookShelf];
  let safetitle =[title2];
  const SQL2 = 'SELECT * FROM books WHERE title =$1;';
  client.query(SQL, safeValues)
    .then(() => {
    });
  return client.query(SQL2,safetitle)
    .then(result => {
      // console.log(result.rows[0].id);
      ln=result.rows[0].id;
      response.redirect(`/books/${ln}`);
    });
}
//Update DB
app.put('/update/:update_book', newUpdate);
function newUpdate (req , res){
  //collect
  let { author, title, isbn, image_url, description ,bookshelf} = req.body;
  //update
  console.log(req.body.bookshelf);
  let SQL = 'UPDATE books set author=$1,title=$2,isbn=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id=$7 ;';
  //safevalues
  let idParam = req.params.update_book;
  let safeValues = [author,title,isbn,image_url, description,bookshelf,idParam];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/books/${idParam}`);
    });
}
//Delete from DB
app.delete('/delete/:deleted_book',deletBook);
function deletBook(req,res){
  let idParam = req.params.deleted_book;
  let saveID = [idParam];
  let sql = 'DELETE FROM books WHERE id=$1;';
  return client.query(sql,saveID)
    .then(()=>{
      res.redirect('/');
    });
}
//Error functions
function errorHandler(err, req, res) {
  res.status(500).send(err);
}
function notFoundHandler(req, res) {
  res.status(404).send('This route does not exist!!');
}
//Starting server after connecting to DB
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT: ${PORT}`)
    });
  });
