const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');
const crypto = require('crypto')
const mailer = require('../modules/mailer')

const User = require('../models/user');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email } = req.body;
  try {

    if (await User.findOne({ email }))
      return res.status(400).send({ error: 'Usuario Já existe!' })
    const user = await User.create(req.body);
    user.password = undefined;
    return res.send({ user });

  } catch (err) {
    return res.status(400).send({ error: 'Falha ao Registrar' });
  }
});

router.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user)
    return res.status(400).send({ error: 'Usuário não cadastrado' });

  if (!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error: 'Senha Inválida' });

  user.password = undefined;
  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: 86400,
  });

  res.send({ user, token });
});

router.post('/forgot_password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).send({ error: 'Usuário não encontrado!' });
    const token = crypto.randomBytes(20).toString('hex');
    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findOneAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    });

    mailer.sendMail({
      to: email,
      from: 'kewen.macedo123@hotmail.com',
      template: '/auth/forgot_password',
      context: { token }
    },
      (err) => {
        if (err)
          return res.status(400).send({ error: 'esqueci minha senha não enviado!' });
      })
      res.send();
  } catch (err) {
    res.status(400).send({ error: 'Erro esqueci minha senha' })
  }
});

router.post('/reset_password', async (req, res) => {
  const { email, token, password } = req.body;
  try {
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires');

    if (!user)
      return res.status(400).send({ error: 'Usuario não encontrado' });
    console.log(token);
    if (token !== user.passwordResetToken)
      return res.status(400).send({ error: 'Token inválido!' })

    const now = new Date();

    if (now > user.passwordResetExpires)
      return res.status(400).send({ error: 'Token expirado: gere um novo' })

    user.password = password;
    await user.save();
    res.send();
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: 'Senha não resetada!' })
  }
})


module.exports = app => app.use('/auth', router);