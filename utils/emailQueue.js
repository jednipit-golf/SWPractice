const nodemailer = require('nodemailer');

class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    createTransporter() {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async sendEmailDirect(options) {
        const transporter = this.createTransporter();

        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        try {
            const info = await transporter.sendMail(message);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Email could not be sent');
        }
    }

    // add queue
    addToQueue(emailData) {
        this.queue.push({
            ...emailData,
            timestamp: new Date(),
            attempts: 0,
            maxAttempts: 3
        });

        // start processing if not already doing so
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const emailData = this.queue.shift();

            try {
                await this.sendEmailDirect({
                    email: emailData.email,
                    subject: emailData.subject,
                    message: emailData.message
                });

                console.log(`Email sent successfully to ${emailData.email}`);
            } catch (error) {
                emailData.attempts++;

                if (emailData.attempts < emailData.maxAttempts) {
                    this.queue.push(emailData);
                    console.log(`Email failed, retrying... (${emailData.attempts}/${emailData.maxAttempts})`);
                } else {
                    console.error(`Email failed permanently to ${emailData.email}:`, error.message);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.processing = false;
    }

    getQueueStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing
        };
    }
}

const emailQueue = new EmailQueue();

module.exports = emailQueue;
