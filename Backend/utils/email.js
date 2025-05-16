const nodemailer = require("nodemailer");
const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require("../config/config");

const sendEmail = async (options) => {
  try {
    // Create a transporter with improved configuration
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // For development only (remove in production)
      }
    });

    // Verify connection configuration
    await transporter.verify();
    console.log("Server is ready to take our messages");

    // Generate HTML version if not provided
    const htmlContent = options.html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3b82f6;">Borrowing System</h1>
        </div>
        <div style="line-height: 1.6;">
          ${(options.message || '').replace(/\n/g, "<br>")}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>If you didn't request this email, please ignore it or contact support.</p>
        </div>
      </div>
    `;

    // Define email options
    const mailOptions = {
      from: `Borrowing System <${EMAIL_FROM || EMAIL_USER}>`,
      to: options.email,
      subject: options.subject || "Notification from Borrowing System",
      text: options.message,
      html: htmlContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Export as direct function
module.exports = sendEmail;