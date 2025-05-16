const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '..', 'uploads');
    
    // Create base uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Determine upload folder based on file type
    if (file.fieldname === 'profileImage') {
      uploadPath = path.join(uploadPath, 'profiles');
    } else if (file.fieldname === 'eventImage') {
      uploadPath = path.join(uploadPath, 'events');
    } else if (file.fieldname === 'categoryIcon') {
      uploadPath = path.join(uploadPath, 'categories');
    } else {
      uploadPath = path.join(uploadPath, 'others');
    }
    
    // Create specific upload directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
