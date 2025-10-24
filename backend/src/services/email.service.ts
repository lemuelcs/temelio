import nodemailer from 'nodemailer';
import logger from '../lib/logger';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465;

const isEmailConfigured = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

interface CredenciaisMotoristaParams {
  nome: string;
  email: string;
  senhaTemporaria: string;
}

export async function enviarCredenciaisMotorista({
  nome,
  email,
  senhaTemporaria,
}: CredenciaisMotoristaParams) {
  if (!transporter) {
    logger.warn(
      { email },
      'Configuração SMTP ausente. Credenciais do motorista não foram enviadas'
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Temello" <${smtpUser}>`,
      to: email,
      subject: 'Credenciais de acesso - Temello',
      text: [
        `Olá, ${nome}!`,
        '',
        'Sua conta no portal da Temello foi criada.',
        'Use a senha temporária abaixo para realizar o primeiro acesso e alterá-la em seguida:',
        '',
        `Senha temporária: ${senhaTemporaria}`,
        '',
        'Acesse: https://app.temello.com.br ou utilize o aplicativo Temello Driver.',
        '',
        'Recomendamos alterar a senha imediatamente após o primeiro login.',
        '',
        'Abraços,',
        'Equipe Temello',
      ].join('\n'),
      html: `
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Sua conta no portal da Temello foi criada.</p>
        <p>
          Utilize a senha temporária abaixo para realizar o primeiro acesso e alterá-la em seguida:
        </p>
        <p style="font-size:18px;font-weight:bold;">
          ${senhaTemporaria}
        </p>
        <p>
          Acesse: <a href="https://app.temello.com.br">https://app.temello.com.br</a>
          ou utilize o aplicativo Temello Driver.
        </p>
        <p>
          Recomendamos alterar a senha imediatamente após o primeiro login.
        </p>
        <p>Abraços,<br />Equipe Temello</p>
      `,
    });

    logger.info({ email }, 'Credenciais enviadas para motorista');
  } catch (error) {
    logger.error(
      {
        email,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      'Falha ao enviar e-mail de credenciais para motorista'
    );
  }
}
