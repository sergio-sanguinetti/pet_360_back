const nodemailer = require('nodemailer')

const getTransporter = () => {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS

  if (!gmailUser || !gmailPass) {
    throw new Error('Faltan variables de entorno para Gmail: GMAIL_USER y GMAIL_PASS')
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  })
}

const sendResetPasswordEmail = async ({ to, resetUrl }) => {
  const from = process.env.GMAIL_FROM || process.env.GMAIL_USER
  const subject = process.env.GMAIL_RESET_SUBJECT || 'PETLIFE 360 - Restablecer contraseña'

  if (!to) {
    throw new Error('Campo "to" requerido para enviar email')
  }
  if (!resetUrl) {
    throw new Error('Campo "resetUrl" requerido para enviar email')
  }

  const transporter = getTransporter()

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.4;">
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;">
          Restablecer contraseña
        </a>
      </p>
      <p>
        Si no solicitaste este cambio, puedes ignorar este correo.
      </p>
      <p style="color:#6b7280;font-size:12px;">
        Este enlace expira pronto por seguridad.
      </p>
    </div>
  `

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `Restablece tu contraseña aquí: ${resetUrl}`,
    html
  })
}

module.exports = {
  sendResetPasswordEmail
}

