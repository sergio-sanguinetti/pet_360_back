const nodemailer = require('nodemailer')

const getGmailConfig = () => {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS

  if (!gmailUser || !gmailPass) {
    throw new Error('Faltan variables de entorno para Gmail: GMAIL_USER y GMAIL_PASS')
  }

  const host = process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.GMAIL_SMTP_PORT || 587)
  const secure = String(process.env.GMAIL_SMTP_SECURE || '').toLowerCase() === 'true'

  const timeouts = {
    connectionTimeout: Number(process.env.GMAIL_SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.GMAIL_SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.GMAIL_SMTP_SOCKET_TIMEOUT_MS || 20000)
  }

  return {
    gmailUser,
    gmailPass,
    host,
    port,
    secure,
    timeouts
  }
}

const isTimeoutError = (err) => {
  const msg = String(err?.message || '').toLowerCase()
  const code = String(err?.code || '').toLowerCase()
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    code.includes('etimedout') ||
    code.includes('econn') ||
    code.includes('econnreset') ||
    msg.includes('socket')
  )
}

const createTransport = ({ host, port, secure, gmailUser, gmailPass, timeouts }) => {
  return nodemailer.createTransport({
    host,
    port,
    secure, // true => SMTPS (465), false => STARTTLS (587)
    auth: { user: gmailUser, pass: gmailPass },
    ...timeouts
  })
}

const getTransporter = () => {
  const cfg = getGmailConfig()
  return createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    gmailUser: cfg.gmailUser,
    gmailPass: cfg.gmailPass,
    timeouts: cfg.timeouts
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

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: `Restablece tu contraseña aquí: ${resetUrl}`,
      html
    })
  } catch (err) {
    // Fallback: si el entorno bloquea STARTTLS/587, probamos 465.
    if (isTimeoutError(err)) {
      const cfg = getGmailConfig()
      const shouldFallback =
        process.env.GMAIL_SMTP_PORT
          ? Number(process.env.GMAIL_SMTP_PORT) === 587
          : cfg.port === 587

      if (shouldFallback) {
        const fallbackTransporter = createTransport({
          host: cfg.host,
          port: 465,
          secure: true,
          gmailUser: cfg.gmailUser,
          gmailPass: cfg.gmailPass,
          timeouts: cfg.timeouts
        })

        await fallbackTransporter.sendMail({
          from,
          to,
          subject,
          text: `Restablece tu contraseña aquí: ${resetUrl}`,
          html
        })
        return
      }
    }

    throw err
  }
}

module.exports = {
  sendResetPasswordEmail
}

