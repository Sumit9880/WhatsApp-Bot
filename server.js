const express = require('express');
const https = require('https');
const http = require('http');
const helmet = require('helmet');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const globalRoutes = require('./Routes/global');
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || 'localhost';
const mongoUrl = process.env.MONGO_URL;
const server = http.createServer(app);

app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb', extended: true }));
app.use('/static', express.static(path.join(__dirname, './Uploads')));
app.use(cors());
app.use(helmet());
app.disable('x-powered-by');

app.use('/', globalRoutes);

server.listen(port, hostname, () => {
  console.log('Project listening on', `${hostname}:${port}!`);
});

mongoose.connect(mongoUrl)
.then(() => {
  console.log("Database Connected");
})
.catch((err) => {
  console.log(err);
})

