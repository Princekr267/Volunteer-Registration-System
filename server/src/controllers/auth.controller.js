import User from '../models/User.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import jwt from 'jsonwebtoken';

const generateToken = (req, res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_key_for_volunteer_registration_system_123!@#', {
    expiresIn: '30d'
  });

  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

export const registerUser = async (req, res) => {
  const { email, password, fullName, role } = req.body;

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName,
      role: role || 'volunteer'
    });

    if (user.role === 'volunteer') {
      await VolunteerProfile.create({ user: user._id });
    }

    generateToken(req, res, user._id);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await user.comparePassword(password))) {
      generateToken(req, res, user._id);
      res.json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = (req, res) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).json({ message: 'User profile not found' });
  }
};
