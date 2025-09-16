import nodemailer from "nodemailer";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const testAcc = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAcc.user, pass: testAcc.pass },
      });
    })();
  }
  return transporterPromise;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: '"Mangodo Chat" <no-reply@mangodo.dev>',
    to,
    subject: "Hesabını Doğrula",
    html: `<p>Hesabını etkinleştirmek için tıkla: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
  return { previewUrl: nodemailer.getTestMessageUrl(info) };
}
