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

  // Preferimos Resend cuando está configurado (evita SMTP bloqueado).
  if (process.env.RESEND_API_KEY) {
    const from = process.env.RESEND_FROM || process.env.GMAIL_FROM || process.env.GMAIL_USER
    if (!from) {
      throw new Error('Falta RESEND_FROM (o GMAIL_FROM/GMAIL_USER) en el entorno')
    }

    const timeoutMs = Number(process.env.RESEND_TIMEOUT_MS || 20000)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const resendRes = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          text: `Restablece tu contraseña aquí: ${resetUrl}`,
          html
        }),
        signal: controller.signal
      })

      if (!resendRes.ok) {
        const bodyText = await resendRes.text().catch(() => '')
        throw new Error(`Resend falló (${resendRes.status}): ${bodyText || resendRes.statusText}`)
      }
      return
    } catch (err) {
      if (String(err?.name) === 'AbortError') {
        throw new Error(`Resend timeout (> ${timeoutMs}ms) al enviar el email`)
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  const cfg = getGmailConfig()
  const mailOptions = {
    from,
    to,
    subject,
    text: `Restablece tu contraseña aquí: ${resetUrl}`,
    html
  }

  const attemptSend = async ({ host, port, secure }) => {
    const t = createTransport({
      host,
      port,
      secure,
      gmailUser: cfg.gmailUser,
      gmailPass: cfg.gmailPass,
      timeouts: cfg.timeouts
    })
    return t.sendMail(mailOptions)
  }

  let firstErr = null
  try {
    // Intento 1: el puerto/config que esté en env (por defecto 587 STARTTLS)
    await attemptSend({ host: cfg.host, port: cfg.port, secure: cfg.secure })
    return
  } catch (err) {
    firstErr = err
    console.error(
      '[emailService] Falló Gmail intento 1',
      JSON.stringify({ host: cfg.host, port: cfg.port, secure: cfg.secure }),
      err?.message || err
    )
  }

  try {
    // Intento 2: SMTPS 465
    await attemptSend({ host: cfg.host, port: 465, secure: true })
    return
  } catch (err2) {
    console.error(
      '[emailService] Falló Gmail intento 2',
      JSON.stringify({ host: cfg.host, port: 465, secure: true }),
      err2?.message || err2
    )

    const msg1 = firstErr?.message || String(firstErr)
    const msg2 = err2?.message || String(err2)
    throw new Error(
      `Gmail SMTP no disponible. Intento1(${cfg.host}:${cfg.port}, secure=${cfg.secure})=${msg1}; intento2(${cfg.host}:465, secure=true)=${msg2}`
    )
  }
}

module.exports = {
  sendResetPasswordEmail
}

