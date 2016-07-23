var http = require("http");
var server = require("./index.js");
var port = process.env.port || 80; // Provides compatability with my app-manager.
http.createServer(server).listen(port, function() {
  console.log("Server is running on port: %d", port);
});
