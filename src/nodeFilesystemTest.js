const fs = require("fs");

fs.readdir("./results", (err, filenames) => {
  try {
    filenames.forEach((filename) => {
      fs.readFile(`./results/${filename}`, "utf-8", (err, fileContents) => {
        console.log(filename, fileContents);
      });
    });
  } catch (error) {
    console.log(error);
  }
});
