const express = require('express');
var path = require("path");
const app = express();

app.use('/src', express.static('src'));

app.get('/', (req, res) => {
  // You can replace this file with any example html file
  res.sendFile(path.join(__dirname + '/vanilla_css_styles.html'));
});

app.listen(8080, () => console.log('Listening on port 8080!'));