const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[randomURL] = longURL;
  res.redirect(`/urls/${randomURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = newURL;
  res.redirect("/urls");
});

function generateRandomString() {
  let radomString = Math.random().toString(32).substring(2, 5) + Math.random().toString(32).substring(2, 5);
  return radomString;
};

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// The Login Route
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

// Registration Page
app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_register", templateVars)
});

//checking if there's same email in the database
function checkDuplicateEmail(email){
  for(var key in users){
    if(users[key].email===email){
      return true;
    }
  }
  return false;
}

// Registration Handler
app.post("/register", (req, res) => {

  //1. get the user email and password
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  //Validation to check whether the username and password are not empty
  if(!userEmail || !userPassword){
    res.send('Hey you must supply username and password. Error: 400');
  } else {
    //2. validation to verify that email has not been taken.
    var result = checkDuplicateEmail(userEmail);
    if(result){
      //it means the email has been taken
      res.send('Email is already taken. Please try with another one. Error: 400');
    } else{
      //everything looks fine. go ahead with registration.
      const userRandomID = generateRandomString();
      users[userRandomID] =  {};
      users[userRandomID].id = userRandomID;
      users[userRandomID].email = userEmail;
      users[userRandomID].password = userPassword;
      console.log(users);
      res.cookie("user_id", userRandomID);
      res.redirect("/urls");
    }

  }
  // Below is the code that I made by myself, previous one is done with assistance
  // const userRandomID = generateRandomString();
  // const userEmail = req.body.email;
  // const userPassword = req.body.password;
  // // handle errors
  // for (let key in users) {
  //   if (userEmail) {
  //     if (userEmail !== users[key].email) {
  //       users[userRandomID] = {};
  //       users[userRandomID].id = userRandomID;
  //       users[userRandomID].email = userEmail;
  //       users[userRandomID].password = userPassword;
  //       console.log(users);
  //       res.cookie("user_id", userRandomID);
  //       res.redirect("/urls");
  //     } else {
  //       res.send("<html><body>Error<b> 400 : existing email</b></body></html>\n")
  //     }
  //   } else {
  //     res.send("<html><body>Error<b> 400 : plase register again </b></body></html>\n")
  //   }
  // }
});








app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});