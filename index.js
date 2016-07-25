// Not designed to scale, messages stored in memory, if needs to be scalable migrate to database, follows async form for this reason.
var fs = require("fs");
var crypto = require("crypto");
var express = require("express");
var app = express();
var time = require("./time.js");
var cookieParser = require("cookie-parser");
var messages = loadData("messages.json");
var members = loadData("members.json");
var tokens = loadData("tokens.json");
app.use(cookieParser());

function loadData(path) {
  var fullPath = `${__dirname}/data/${path}`;
  var data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch(e) {
    data = {};
    storeData(path, data);
  }
  return data;
}

function storeData(path, data) {
  try {
    fs.accessSync(__dirname + "/data", fs.R_OK | fs.W_OK);
  } catch(e) {
    fs.mkdirSync(__dirname + "/data");
  }
  var fullPath = `${__dirname}/data/${path}`;
  console.log(fullPath);
  if(typeof data == "object")
    data = JSON.stringify(data, null, "  ");
  fs.writeFileSync(fullPath, data);
}

function getMessages(id, ownId, cb) {
  if(id == ownId) {
    process.nextTick(function() {
      cb(messages[id]);
    })
  }
  var requested = messages[id];
  filter(requested, ownId);
}

function filter(messages, ownId) {
  var filtered = [];
  for(var message of messages) {
    if(!message.private || message.sender == ownId)
      filtered.push(message);
  }
  return filtered;
}

app.post("/user", function(req, res) {
  var id = req.body.id;
  var uid = -1;
  var token = tokens[req.cookie.token];
  if(token && token.expiry > new Date().getTime())
    uid = token.uid;
  getMessages(id, uid, function(data) {
    res.send(data);
  });
});

app.post("/login", function(req, res) {
  if(!req.body.user || !req.body.pass || !members[req.body.user]) {
    badLogin.apply(this, arguments);
  }
  var valid = checkPassword(req.body.user, req.body.pass);
  if(!valid) {
    badLogin.apply(this, arguments);
  }
  var id = members[req.body.user].id;
  var token = tokenGen(id);
  tokens[token.id] = token;
  res.cookie("token", token.id);
});

app.post("/register", function(req, res) {
  if(!isUnique(req.body.user)) {
    return res.status(409).send({success: false, reason: "EEXISTS"});
  }
  var pass = hashPass(req.body.password);
  var id = crypto.randomBytes(16).toString("base64");
  members[req.body.user] = {
    id: id,
    username: req.body.user,
    password: pass
  }
  var token = tokenGen(id);
  tokens[token.id] = token;
  res.cookie("token", token.id).send({success: true, id: id});
});

app.post("/validUser", function(req, res) {
  var user = req.body.user;
  res.send({valid: members[req.body.user] == undefined});
});

function badLogin(req, res) {
  res.status(403).send({ success: false, reason: "BAD_INFO"});
}

function hashPass(pass) {
  var hash = crypto.createHash("sha512");
  return hash.update(req.body.hash).digest("base64");
}

function isUnique(u) {
  return members[u] == undefined;
}

function tokenGen(uid) {
  var expiry = Date.now();
  expiry += time.month;
  var token = {};
  token.expiry = expiry;
  token.uid = uid;
  token.id = crypto.randomBytes(16).toString("base64");
  return token;
}

module.exports = app;
