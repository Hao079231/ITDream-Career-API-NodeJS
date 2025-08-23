const nodemailer = require('nodemailer');

exports.sendOtpEmail = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'haotrung123test@gmail.com',
      pass: 'strxhtwlojmxeoqj'
    }
  });

  const mailOptions = {
    from: 'haotrung123test@gmail.com',
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };

  await transporter.sendMail(mailOptions);
};