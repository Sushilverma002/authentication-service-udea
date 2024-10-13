import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER_NAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async mailer(mailBody: nodemailer.SendMailOptions) {
    const defaultMailOptions = {
      from: process.env.MAIL_USER_NAME,
    };
    const finalMailOptions = { ...defaultMailOptions, ...mailBody };
    await this.transporter.sendMail(finalMailOptions);
  }
}
