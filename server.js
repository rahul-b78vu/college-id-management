// Root forwarder to backend server
const path = require("path");
process.chdir(path.join(__dirname, "backend"));
require(path.join(__dirname, "backend", "server.js"));

