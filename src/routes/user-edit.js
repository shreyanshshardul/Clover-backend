const User = require('../models/User');
const bcrypt = require('bcrypt'); // ✅ replaced argon2 with bcrypt
const validator = require('validator');
const xss = require('xss');

module.exports = async (req, res, next) => {
  try {
    let username = xss(req.fields.username);
    let email = xss(req.fields.email);
    let firstName = xss(req.fields.firstName);
    let lastName = xss(req.fields.lastName);
    let { password, repeatPassword, user } = req.fields;

    // ✅ check user authorization
    if (req.user.level !== 'root') {
      return res.status(401).send('401 Unauthorized User');
    }

    let errors = {};

    // ✅ password check
    if (password !== repeatPassword) {
      errors.password = 'Passwords not matching';
      errors.repeatPassword = 'Passwords not matching';
    }

    // ✅ email validation
    if (!validator.isEmail(email)) {
      errors.email = 'Invalid email.';
    }

    email = email.toLowerCase();

    // ✅ check username & email uniqueness
    const isUsername = await User.findOne({ username });
    if (isUsername && username !== user.username)
      errors.username = 'Username taken.';

    const isEmail = await User.findOne({ email });
    if (isEmail && email !== user.email)
      errors.email = 'Email already in use.';

    if (Object.keys(errors).length > 0)
      return res.status(400).json(errors);

    let query = {
      username: xss(username),
      email: xss(email),
      firstName: xss(firstName),
      lastName: xss(lastName),
    };

    // ✅ if password provided, hash it
    if (typeof password === 'string' && password.length > 0) {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      query.password = hash;
    }

    // ✅ update user info
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: query },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ error: 'User not found.' });

    res.status(200).json(updatedUser);

  } catch (err) {
    console.error('❌ Update User Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
