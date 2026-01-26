// const fs = require("fs");
// const path = require("path");

// const uploadsDir = path.join(__dirname, "../../uploads");

// const MAX_FILE_AGE_MINUTES = 30;

// const deleteOldUploadFiles = () => {
//   if (!fs.existsSync(uploadsDir)) {
//     console.log("uploads folder not found, skipping cleanup");
//     return;
//   }

//   const now = Date.now();
//   const maxAgeMs = MAX_FILE_AGE_MINUTES * 60 * 1000;

//   fs.readdirSync(uploadsDir).forEach((file) => {
//     const filePath = path.join(uploadsDir, file);

//     try {
//       const stats = fs.statSync(filePath);

//       if (stats.isFile()) {
//         const fileAge = now - stats.mtimeMs;

//         if (fileAge > maxAgeMs) {
//           fs.unlinkSync(filePath);
//           console.log(`🗑 Deleted old file: ${file}`);
//         }
//       }
//     } catch (err) {
//       console.error("Error deleting file:", filePath, err.message);
//     }
//   });

//   console.log("Old upload files cleanup done");
// }


// module.exports = {deleteOldUploadFiles}