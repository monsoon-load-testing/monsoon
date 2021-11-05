const fs = require('fs').promises;
const parse = require("csv-parse");
const INPUT_PATH = "./csv/load-gen.csv";
const OUTPUT_DIR_PATH = "";

(async () => {
  try {
    const input = await fs.readFile(INPUT_PATH, "utf-8");
    
    parse(input, {}, (err, output) => {
      for (let i = 1; i < output.length; i++) {
        let currentArray = output[i];
        let [ userId, stepName, stepStartTime, responseTime ] = currentArray;
        let currentObj = {
          userId,
          stepStartTime,
          metrics: {
            responseTime,
          }
        }
        
        let filename = `${userId}-${stepName}-${stepStartTime}`
        fs.writeFile(`${OUTPUT_DIR_PATH}/${filename}`, JSON.stringify(currentObj))
      }
    });
  } catch (err) {
    console.log(err);
  }
})()