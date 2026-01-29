const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "/tmp/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 2, 
  },
});

module.exports = { upload };




// const multer = require('multer')

// const storage = multer.memoryStorage()

// // const upload = multer({storage:storage})
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 1024 * 1024 * 1024 * 2, 
//   },
// });

// module.exports = {upload}
