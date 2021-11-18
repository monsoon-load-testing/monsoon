const express = require("express");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
const HttpError = require("./models/httpError");
const routes = require("./routes/api");

const app = express();
const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static("build"));
app.use(express.json());
app.use("/api", routes);

app.get("/tests/*", (req, res) => {
  res.redirect("/");
});

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ error: err.message || "An unknown error occured" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
