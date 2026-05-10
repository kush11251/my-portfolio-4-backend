const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import Models
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Contact = require('../models/Contact');
const Counter = require('../models/Counter');

// Import Middleware
const { protect, admin } = require('../middleware/auth');

// Generate JWT Token Helper
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ==========================================
// 20. Health Route (Open)
// ==========================================
router.get('/health', (req, res) => res.status(200).json({ status: 'API is running healthy' }));

// ==========================================
// 21. Delete All Data (Open)
// ==========================================
router.delete('/delete-all', async (req, res) => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Visitor.deleteMany({}),
      Contact.deleteMany({}),
      Counter.deleteMany({})
    ]);

    res.json({ message: 'All data deleted from MongoDB' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// AUTH & USERS
// ==========================================

// 1. Login (Open)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ _id: user._id, email: user.email, role: user.role, token: generateToken(user._id) });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// 2. Signup (Open)
router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ email, password: hashedPassword, role });
  if (user) {
    res.status(201).json({ _id: user._id, email: user.email, token: generateToken(user._id) });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// 3. Logout (Open)
// Note: In stateless JWT, logout is usually handled client-side by deleting the token.
// We provide an endpoint here for structural completeness.
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully. Please remove token on client side.' });
});

// 4. Get all users (Admin)
router.get('/users', protect, admin, async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// ==========================================
// COUNTER
// ==========================================

// Helper to get or create counter singleton
const getCounterDoc = async () => {
  let counter = await Counter.findOne();
  if (!counter) counter = await Counter.create({ count: 0 });
  return counter;
};

// 5. Increment Counter (Open)
router.post('/counter/increment', async (req, res) => {
  const counter = await getCounterDoc();
  counter.count += 1;
  await counter.save();
  res.json(counter);
});

// 6. Get Counter (Open)
router.get('/counter', async (req, res) => {
  const counter = await getCounterDoc();
  res.json(counter);
});

// 7. Reset Counter (Admin)
router.post('/counter/reset', protect, admin, async (req, res) => {
  const counter = await getCounterDoc();
  counter.count = 0;
  await counter.save();
  res.json({ message: 'Counter reset', counter });
});

// ==========================================
// CONTACTS
// ==========================================

// 8. Add contact (Open)
router.post('/contacts', async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 9. Get all contacts (Admin)
router.get('/contacts', protect, admin, async (req, res) => {
  const contacts = await Contact.find({});
  res.json(contacts);
});

// 10. Update a contact (Admin)
router.put('/contacts/:id', protect, admin, async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (contact) res.json(contact);
  else res.status(404).json({ message: 'Contact not found' });
});

// 11. Get a contact (Admin)
router.get('/contacts/:id', protect, admin, async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (contact) res.json(contact);
  else res.status(404).json({ message: 'Contact not found' });
});

// 12. Delete all contacts (Admin)
router.delete('/contacts', protect, admin, async (req, res) => {
  await Contact.deleteMany({});
  res.json({ message: 'All contacts deleted' });
});

// 13. Delete one contact (Admin)
router.delete('/contacts/:id', protect, admin, async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (contact) res.json({ message: 'Contact removed' });
  else res.status(404).json({ message: 'Contact not found' });
});

// ==========================================
// VISITORS
// ==========================================

// 14. Add visitor data (Open)
router.post('/visitors', async (req, res) => {
  try {
    const visitor = await Visitor.create(req.body);
    res.status(201).json(visitor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 15. Get all visitors (Admin)
router.get('/visitors', protect, admin, async (req, res) => {
  const visitors = await Visitor.find({});
  res.json(visitors);
});

// 17. Query visitor (Admin)
// Must be placed BEFORE /:id so Express doesn't interpret "query" as an ID
router.get('/visitors/query', protect, admin, async (req, res) => {
  // Example query usage: /api/visitors/query?browser=Chrome&deviceType=desktop
  const visitors = await Visitor.find(req.query);
  res.json(visitors);
});

// 16. Get a visitor (Admin)
router.get('/visitors/:id', protect, admin, async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);
  if (visitor) res.json(visitor);
  else res.status(404).json({ message: 'Visitor not found' });
});

// 18. Delete all visitors (Admin)
router.delete('/visitors', protect, admin, async (req, res) => {
  await Visitor.deleteMany({});
  res.json({ message: 'All visitors deleted' });
});

// 19. Delete one visitor (Admin) 
router.delete('/visitors/:id', protect, admin, async (req, res) => {
  const visitor = await Visitor.findByIdAndDelete(req.params.id);
  if (visitor) res.json({ message: 'Visitor removed' });
  else res.status(404).json({ message: 'Visitor not found' });
});

module.exports = router;