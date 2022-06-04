const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const route = require("./routes/route");
const multer = require("multer");
const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(multer().any())

mongoose
  .connect(
    "mongodb+srv://deepJyoti982:deep982@cluster0.hcglv.mongodb.net/deepJyoti982", {
      useNewUrlParser: true,
    }
  )
  .then((result) => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

app.use("/", route);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});