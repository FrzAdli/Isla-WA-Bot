const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('YOUR_FIREBASE_JSON');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'YOUR_BUCKET_NAME'
});
const bucket = admin.storage().bucket();

const uploadImage = async (tempPath) => {
  return new Promise((resolve, reject) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    });

    const upload = multer({
      storage: storage,
      fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
        }
      }
    }).single('image');

    const req = { file: { path: tempPath }, headers: {} }; // Buat objek req sederhana dengan properti file.path
    const res = {}; // Buat objek res sederhana

    upload(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        const filePath = req.file.path;
        const fileUpload = bucket.file(filePath);
    
        // Upload gambar ke Firebase Storage
        fileUpload.createWriteStream()
          .on('error', (error) => {
            reject(error);
          })
          .on('finish', () => {
            // Dapatkan URL gambar yang diunggah dengan metode getSignedUrl
            fileUpload.getSignedUrl({ action: 'read', expires: '03-01-2024' }) // Atur waktu kadaluarsa sesuai kebutuhan Anda
              .then((signedUrls) => {
                const imageUrl = signedUrls[0];
                resolve(imageUrl);
              })
              .catch((error) => {
                reject(error);
              });
          })
          .end(fs.readFileSync(filePath)); // Baca gambar dari path lokal dan upload
      }
    });
  });
};

module.exports = uploadImage;
