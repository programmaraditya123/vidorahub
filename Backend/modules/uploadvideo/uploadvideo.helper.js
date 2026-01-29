const { Storage } = require("@google-cloud/storage");
require('dotenv').config();
// const {ffmpeg}  = require("fluent-ffmpeg");
const fs = require("fs");

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});


const bucket = storage.bucket("vidorahub");

async function uploadToGCS(file) {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(Date.now() + "-" + file.originalname);

    const blobStream = blob.createWriteStream({
      resumable: true,
      contentType: file.mimetype,
    });

    const readStream = fs.createReadStream(file.path);

    readStream
      .pipe(blobStream)
      .on("error", reject)
      .on("finish", async () => {
        fs.unlinkSync(file.path);
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      });
  });
}


module.exports = { uploadToGCS };
