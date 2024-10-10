const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();


// Configuration
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI ;

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Define the Profile Model
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, required: true },
  handle: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  website: { type: String },
  profilePictureUrl: { type: String },
  joinedDate: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'twitter-profile Service is up and running!' });
});
// Get a user's profile
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user's profile
app.put('/api/profiles/:userId', upload.single('profilePicture'), async (req, res) => {
  const { name, handle, bio, location, website } = req.body;
  const profilePictureUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updateData = {
      name,
      handle,
      bio,
      location,
      website,
      ...(profilePictureUrl && { profilePictureUrl })
    };

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
      { new: true, upsert: true }
    );

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Profile Service running on port ${PORT}`);
});
