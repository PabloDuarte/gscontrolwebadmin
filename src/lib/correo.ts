import 'server-only';
import nodemailer from 'nodemailer';

/** Envía con la cuenta SMTP de Inteconayc (Gmail, puerto 587 y STARTTLS). */
export async function enviarCorreo(para: string, asunto: string, texto: string) {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const user = process.env.SMTP_USER?.trim() ?? '';
  const pass = process.env.SMTP_PASSWORD ?? '';
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!host || !user || !pass) {
    throw new Error('El correo no está configurado.');
  }

  const desde = user.includes('@') ? user : user;
  const nombre = process.env.SMTP_FROM_NAME?.trim() || 'GsControl';
  const transporte = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporte.sendMail({
    from: `${nombre} <${desde}>`,
    to: para,
    subject: asunto,
    text: texto,
  });
}
