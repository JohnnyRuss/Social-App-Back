const mailer = require('nodemailer');

const sendEmail = async (options) => {
  const transport = mailer.createTransport({
    host: process.env.MAIL_TRAP_HOST,
    port: process.env.MAIL_TRAP_PORT,
    auth: {
      user: process.env.MAIL_TRAP_USER_NAME,
      pass: process.env.MAIL_TRAP_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'Lama-Social <lama.social@io.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
