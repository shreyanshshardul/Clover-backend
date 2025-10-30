const router = require('express').Router();
const AuthCode = require('../../models/AuthCode');
const Email = require('../../models/Email');
const User = require('../../models/User');
const config = require('../../../config');
const moment = require('moment');
const bcrypt = require('bcrypt'); // ✅ replaced argon2 with bcrypt

router.post('*', async (req, res) => {
  let { code, email, password } = req.fields;

  // ✅ Basic checks
  if (!email) {
    return res.status(400).json({ status: 'error', code: 'email required' });
  }

  if (!code) {
    return res.status(400).json({ status: 'error', code: 'auth code required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'error', code: 'the associated user is no longer valid' });
    }

    const authCode = await AuthCode.findOne({ code, user, valid: true });
    if (!authCode) {
      return res.status(404).json({ status: 'error', code: 'auth code not found' });
    }

    if (moment(authCode.expires).isBefore(moment())) {
      return res.status(400).json({ status: 'error', code: 'auth code expired' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        password: 'password too short, must be at least 6 characters',
      });
    }

    // ✅ bcrypt hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;

    await user.save();

    // ✅ Optional: mark auth code as used
    authCode.valid = false;
    await authCode.save();

    // ✅ Create confirmation email
    const entry = new Email({
      from: config.nodemailer.from,
      to: user.email,
      subject: `${config.appTitle || config.appName || 'Clover'} - Password changed`,
      html: `
        <p>Hello ${user.firstName || ''},</p>
        <p>Your password has been successfully changed!</p>
        <p><strong>Timestamp:</strong> ${moment().format('HH:mm - D MMMM YYYY')}</p>
      `,
    });

    await entry.save();

    res.status(200).json({ status: 'success', message: 'Password updated and email queued.' });

  } catch (error) {
    console.error('❌ Password Reset Error:', error);
    res.status(500).json({ status: 'error', code: 'internal server error' });
  }
});

module.exports = router;
