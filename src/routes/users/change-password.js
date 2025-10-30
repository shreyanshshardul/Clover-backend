const bcrypt = require('bcrypt'); // ✅ replaced argon2
const isEmpty = require('../../utils/isEmpty');
const User = require('../../models/User');

module.exports = async (req, res) => {
  const { password } = req.fields;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'user not found' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        password: 'password too short, must be at least 6 characters',
      });
    }

    if (!isEmpty(password)) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id);

    res.status(200).json({ status: 'success', user: updatedUser });
  } catch (error) {
    console.error('❌ Password Update Error:', error);
    res.status(500).json({ status: 'error', message: 'internal server error' });
  }
};
