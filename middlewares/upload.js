import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== '.mp3' && ext !== '.wav' && ext !== '.m4a') {
    return cb(new Error('Only audio files are allowed'), false);
  }
  cb(null, true);
};

export const upload = multer({ storage, fileFilter });
