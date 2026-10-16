require("dotenv/config");

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required.",
      });
    }

    const customerName = name.trim();
    const customerEmail = email.trim();
    const customerPhone =
      typeof phone === "string" ? phone.trim() : "";
    const customerMessage = message.trim();

    if (
      customerName.length > 100 ||
      customerEmail.length > 254 ||
      customerPhone.length > 20 ||
      customerMessage.length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS ||
        !process.env.COMPANY_EMAIL) {
      throw new Error("Email environment variables are missing.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const templatePath = path.join(
      __dirname,
      "../views/emails/contact.ejs"
    );

    const html = await ejs.renderFile(templatePath, {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      message: customerMessage,
    });

    await transporter.sendMail({
      from: `"AK Kitchen Center Website" <${process.env.EMAIL_USER}>`,
      to: process.env.COMPANY_EMAIL,
      replyTo: customerEmail,
      subject: `New Contact Enquiry from ${customerName}`,
      html,
      text: [
        "New Contact Form Submission",
        `Name: ${customerName}`,
        `Email: ${customerEmail}`,
        `Phone: ${customerPhone || "Not provided"}`,
        "",
        "Message:",
        customerMessage,
      ].join("\n"),
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Contact email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
};

module.exports = sendContactEmail;
