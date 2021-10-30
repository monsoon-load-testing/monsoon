const fs = require("fs");

async function ls(path) {
  const dir = await fs.promises.opendir(path);
  console.log(dir);
  //for await (const dirent of dir) {
  //  console.log(dirent.name);
  //}
}

ls(".").catch(console.error);
