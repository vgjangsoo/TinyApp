const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["secret keys"]
}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// Create a users obj
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Generates random string
function generateRandomString() {
  let radomString = Math.random().toString(32).substring(2, 5) + Math.random().toString(32).substring(2, 5);
  return radomString;
};

//checking if there's same email in the database
function checkDuplicateEmail(email) {
  for (var key in users) {
    if (users[key].email === email) {
      return key;
    }
  }
};

//check if there's user_id
function urlsForUser(id) {
  let newURL = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      newURL[key] = urlDatabase[key];
    }
  }
  return newURL;
};

//check if the password matched on the database
function checkEmailAndPassword(email, password) {
  for (var key in users) {
    if (users[key].email === email) {
      if(bcrypt.compareSync(password, users[key].password)) {
        return key;
      }
    }
  }
};

//current date function
function getCurrentDate() {
    var currentDate = new Date();
    var day = (currentDate.getDate() < 10 ? '0' : '') + currentDate.getDate();
    var month = ((currentDate.getMonth() + 1) < 10 ? '0' : '') + (currentDate.getMonth() + 1);
    var year = currentDate.getFullYear();
    var hour = (currentDate.getHours() < 10 ? '0' : '') + currentDate.getHours();
    var minute = (currentDate.getMinutes() < 10 ? '0' : '') + currentDate.getMinutes();
    var second = (currentDate.getSeconds() < 10 ? '0' : '') + currentDate.getSeconds();
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
};

// redirects to the homepage
app.get("/", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//main page GET
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const URLs = urlsForUser(userID);
  let templateVars = {
    urls: URLs,
    user_id: users[userID],
    date: getCurrentDate()
  };
  // see if logged in or not
  if (!users[req.session.user_id]) {
    res.send(`<html><h1>Please <a href="/login">login</a> first!</h1></html>`);
  } else {
    res.render("urls_index", templateVars);
  }
});

//main page POST
app.post("/urls", (req, res) => {
  // see if the user is logged in or not
  if (!users[req.session.user_id]) {
    res.send("Please login first!!");
  }
  const randomURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[randomURL] = {
    longURL: longURL,
    userID: req.session.user_id
  }
  res.redirect(`/urls/${randomURL}`);
});

// "/urls/new" page GET
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: users[req.session.user_id]
  }
  // if user is not logged in redirect to login page.
  if (!users[req.session.user_id]) {
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

// "urls/:shortURL" GET
app.get("/urls/:shortURL", (req, res) => {
  // see if the user is logged in but does not own the URL
  if (!urlDatabase[req.params.shortURL]) {
    return res.send(`<html><h1><a href="/login">Login<a> and create ShortURL.</h1></html>`);
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.session.user_id],
    date: getCurrentDate()
  };
  // if the user is not logged in,
  if (!users[req.session.user_id]) {
    return res.send(`<html><h1>Please <a href="/login">login</a> first.</h1></html>`)
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.status(403);
    return res.send(`<html><h1>Error: 403. Please go back to the <a href="/">main page</a></h1></html>`);
  } else {
    res.render("urls_show", templateVars);
  }
});

//POST: edit
app.post("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send(`<html><h1><a href="/login">Login<a> and create ShortURL.</h1></html>`);
  }
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newURL;
  if (!users[req.session.user_id]) {
    return res.send(`<html><h1>Please <a href="/login">login<a> first.</h1></html>`);
  } else {
    res.redirect("/urls");
  }
});

//GET
app.get("/u/:shortURL", (req, res) => {
  // see if URL's not existing
  if (!urlDatabase[req.params.shortURL]) {
    return res.send(`<html><h1>No ShortURL exists. Please go back to the <a href="/">main page</a></h1></html>`);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.send(`<html><h1>Please <a href="/login">login<a> first.</h1></html>`);
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// The Login Route
app.post("/login", (req, res) => {
  const userEmail = req.body.user_id;
  const userPassword = req.body.password;
  if(!userEmail && !userPassword) {
    res.status(400);
    res.send(`<html><h1>Hey you must supply your E-mail and password. Go back to <a href="/login">login page</a>. Error: 400</h1></html>`);
  } else {
    let result = checkDuplicateEmail(userEmail);
    if (!result) {
      res.status(403);
      res.send(`<html><h1>Please <a href="/register">register</a> first. Error: 403</h1></html>`);
    } else {
      let userID = checkEmailAndPassword(userEmail, userPassword);
      if (!userID) {
        res.status(403);
        res.send(`<html><h1>Wrong password. Go back to <a href="/login">login page</a>. Error: 403</h1></html>`);
      } else {
        req.session.user_id = userID;
        res.redirect("/urls");
      }
    }
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/");
})

// Registration Page
app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls")
  }
  const templateVars = {
    user_id: users[req.session.user_id]
  }
  res.render("urls_register", templateVars)
});


// Registration Handler
app.post("/register", (req, res) => {
  //1. get the user email and password
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  //Validation to check whether the username and password are not empty
  if(!userEmail || !userPassword){
    res.status(400);
    res.send(`<html><h1>Hey you must supply your E-mail and password. Go back to <a href="/login">login page</a>. Error: 400</h1></html>`);
  } else {
    //2. validation to verify that email has not been taken.
    var result = checkDuplicateEmail(userEmail);
    if(result){
      //it means the email has been taken
      res.status(400);
      res.send(`<html><h1>Email is already taken. Please try with another one. Go back to <a href="/login">login page</a>. Error: 400</h1></html>`);
    } else {
      //registration.
      const userRandomID = generateRandomString();
      users[userRandomID] =  {};
      users[userRandomID].id = userRandomID;
      users[userRandomID].email = userEmail;
      users[userRandomID].password = bcrypt.hashSync(userPassword, 10);
      req.session.user_id = userRandomID;
      res.redirect("/urls");
    }
  }
});

// rendering to login page
app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls")
  }
  let templateVars = {
    user_id : users[req.body.user_id]
  }
  res.render("urls_login", templateVars);
})

//listen 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});