const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

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
}

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
    // console.log("in method id", id)
    // console.log("in ursl method", urlDatabase[key].userID)
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
      if(users[key].password === password) {
        return key;
      }
    }
  }
};


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
  const userID = req.cookies["user_id"];
  // console.log("userID: ", userID.toString());
  // console.log("database:", urlDatabase);
  const URLs = urlsForUser(userID.toString());
  // console.log("URLs: ", URLs);
  // if (users[userID]) {
  // }
  // const userEmail = userID[email];
  let templateVars = {
    urls: URLs,
    user_id: users[userID]
  };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[randomURL] = {
    longURL: longURL,
    userID: req.cookies["user_id"]
  }
  // console.log("000000000000000000:", urlDatabase);
  res.redirect(`/urls/${randomURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: users[req.cookies["user_id"]]
  }
  // console.log(req.cookies["user_id"]);
  // console.log(users[req.cookies["user_id"]]);
  if (!users[req.cookies["user_id"]]) {
    res.redirect("/register")
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.cookies["user_id"]]
  };
  // console.log("short url page:", urlDatabase);
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// The Login Route
app.post("/login", (req, res) => {
  const userEmail = req.body.user_id;
  const userPassword = req.body.password;
  // console.log(req.body);
  // const userPassword = req.body.password;
  if(!userEmail  && !userPassword) {
    res.send('Hey you must supply your E-mail and password. Error: 400');
  } else {
    let result = checkDuplicateEmail(userEmail);
    if (!result) {
      res.send('Please register first. Error: 403');
    } else {
      //check if the password matches
      let userID = checkEmailAndPassword(userEmail, userPassword);
      // console.log(userID);
      // let users[userID];
      // let emailCheck = checkDuplicateEmail(userEmail);
      if (!userID) {
        res.send('Wrong password. Error: 403');
      } else {
        // console.log(templateVars);
        // console.log(userEmail);
        res.cookie("user_id", userID);
        res.redirect("/urls");
      }
    }
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

// Registration Page
app.get("/register", (req, res) => {
  const templateVars = {
    user_id: users[req.cookies["user_id"]]
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
    res.send('Hey you must supply your E-mail and password. Error: 400');
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
      // console.log(users);
      res.cookie("user_id", userRandomID);
      res.redirect("/urls");
    }
  }
});

// rendering to login page
app.get("/login", (req, res) => {
  let templateVars = {
    user_id : users[req.body.user_id]
  }
  res.render("urls_login", templateVars);
})





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});