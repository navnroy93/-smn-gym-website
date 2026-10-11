const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Owner PIN for secure video upload
const OWNER_PINS = ['070893'];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const EXCEL_FILE_PATH = path.join(DATA_DIR, 'SMN_Gym_Members.xlsx');
const VIDEOS_FILE_PATH = path.join(DATA_DIR, 'videos.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'videos');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration for Video Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (.mp4, .webm, .mov, .m4v) are permitted.'));
    }
  }
});

// Helper: Excel Workbook
function getWorkbook() {
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    try {
      return xlsx.readFile(EXCEL_FILE_PATH);
    } catch (err) {
      console.error('Error reading Excel file:', err);
    }
  }

  const wb = xlsx.utils.book_new();
  const initialData = [
    {
      'Registration Date': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Full Name': 'Demo Member',
      'Mobile Number': '8892152766',
      'Email Address': 'smn.gym.demo@gmail.com',
      'Fitness Goal': 'Weight Loss & Strength',
      'Preferred Plan': 'Quarterly (3 Months)',
      'Status': 'Sample Record'
    }
  ];
  const ws = xlsx.utils.json_to_sheet(initialData);
  xlsx.utils.book_append_sheet(wb, ws, 'Members');
  xlsx.writeFile(wb, EXCEL_FILE_PATH);
  return wb;
}

// Helper: Get Videos list
function getVideosList() {
  if (fs.existsSync(VIDEOS_FILE_PATH)) {
    try {
      const data = fs.readFileSync(VIDEOS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading videos.json:', err);
    }
  }
  return [];
}

function saveVideosList(videos) {
  fs.writeFileSync(VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2), 'utf-8');
}

// ==========================================
// VIDEO PLAYLIST & OWNER UPLOAD ENDPOINTS
// ==========================================

// 1. Get playlist
app.get('/api/videos', (req, res) => {
  const videos = getVideosList();
  res.json({ success: true, videos });
});

// 2. Upload workout video (Owner Only)
app.post('/api/upload-video', upload.single('videoFile'), (req, res) => {
  try {
    const { ownerPin, title, category, description } = req.body;

    // Verify Owner PIN
    if (!ownerPin || !OWNER_PINS.includes(ownerPin.trim())) {
      // Remove uploaded file if pin is invalid
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid Owner PIN. Video uploads can only be performed by the gym owner.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided.'
      });
    }

    const videos = getVideosList();
    const newVideo = {
      id: `vid_${Date.now()}`,
      title: (title || 'Gym Workout Session').trim(),
      category: (category || 'Workout Training').trim(),
      description: (description || 'SMN Gym workout tutorial and form guide.').trim(),
      src: `/uploads/videos/${req.file.filename}`,
      thumbnail: 'assets/gym_interior_1.jpg',
      uploadedAt: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }),
      isDefault: false
    };

    // Prepend newly uploaded video to playlist so it plays first or is featured
    videos.unshift(newVideo);
    saveVideosList(videos);

    console.log(`[VIDEO UPLOADED] ${newVideo.title} (${req.file.filename}) added by Owner.`);

    return res.json({
      success: true,
      message: 'Workout video uploaded successfully! Added to the active playlist.',
      video: newVideo,
      videos
    });
  } catch (err) {
    console.error('Error during video upload:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error uploading video.'
    });
  }
});

// 3. Delete workout video (Owner Only)
app.delete('/api/videos/:id', (req, res) => {
  try {
    const { ownerPin } = req.body;
    const { id } = req.params;

    if (!ownerPin || !OWNER_PINS.includes(ownerPin.trim())) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid Owner PIN.'
      });
    }

    let videos = getVideosList();
    const target = videos.find(v => v.id === id);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Delete local file if it is an uploaded file
    if (target.src && target.src.startsWith('/uploads/videos/')) {
      const localFilePath = path.join(__dirname, 'public', target.src);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    videos = videos.filter(v => v.id !== id);
    saveVideosList(videos);

    return res.json({
      success: true,
      message: 'Video deleted successfully.',
      videos
    });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting video.' });
  }
});

// ==========================================
// REGISTRATION & EXCEL ENDPOINTS
// ==========================================
app.post('/api/register', (req, res) => {
  try {
    const { name, email, phone, goal, plan } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and Mobile Number are required.'
      });
    }

    const now = new Date();
    const formattedDate = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const wb = getWorkbook();
    let ws = wb.Sheets['Members'];
    let records = [];

    if (ws) {
      records = xlsx.utils.sheet_to_json(ws);
    }

    records.push({
      'Registration Date': formattedDate,
      'Full Name': name.trim(),
      'Mobile Number': phone.trim(),
      'Email Address': (email || 'Not Provided').trim(),
      'Fitness Goal': (goal || 'General Fitness').trim(),
      'Preferred Plan': (plan || '1 Month Standard').trim(),
      'Status': 'New Member Inquiry'
    });

    const updatedSheet = xlsx.utils.json_to_sheet(records);
    updatedSheet['!cols'] = [
      { wch: 22 },
      { wch: 24 },
      { wch: 18 },
      { wch: 28 },
      { wch: 25 },
      { wch: 22 },
      { wch: 20 }
    ];

    wb.Sheets['Members'] = updatedSheet;
    xlsx.writeFile(wb, EXCEL_FILE_PATH);

    console.log(`[LEAD SAVED] ${name} (${phone}) added to backend Excel.`);

    return res.json({
      success: true,
      message: `Welcome, ${name}! Your registration has been received. Our team will contact you shortly.`,
      leadCount: records.length
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error saving registration.'
    });
  }
});

// Backend download endpoint for owner
app.get('/api/download-excel', (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      getWorkbook();
    }
    res.download(EXCEL_FILE_PATH, 'SMN_Gym_Registered_Members.xlsx');
  } catch (error) {
    res.status(500).send('Unable to download Excel sheet.');
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const wb = getWorkbook();
    const ws = wb.Sheets['Members'];
    const records = ws ? xlsx.utils.sheet_to_json(ws) : [];
    res.json({ totalRegistrations: records.length });
  } catch (error) {
    res.json({ totalRegistrations: 0 });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SMN GYM Website running at: http://localhost:${PORT}`);
  console.log(`📹 Video Playlist initialized with continuous sequential playback`);
  console.log(`🔒 Owner Upload PINs: 8892 or 8892152766`);
  console.log(`=======================================================`);
});
