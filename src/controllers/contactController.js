const ejs = require("ejs");
const path = require("path");
const { Resend } = require("resend");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d\s()-]{7,20}$/;

const LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  message: 3000,
};

const TEMPLATE_PATH = path.join(__dirname, "../views/emails/contact.ejs");

let resendClient = null;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function validate(body) {
  const { name, email, phone, message } = body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    return { error: "Name, email and message are required." };
  }

  const data = {
    name: name.trim(),
    email: email.trim(),
    phone: typeof phone === "string" ? phone.trim() : "",
    message: message.trim(),
  };

  for (const field of Object.keys(LIMITS)) {
    if (data[field].length > LIMITS[field]) {
      return { error: "One or more fields exceed the allowed length." };
    }
  }

  if (!EMAIL_PATTERN.test(data.email)) {
    return { error: "Please provide a valid email address." };
  }

  if (data.phone && !PHONE_PATTERN.test(data.phone)) {
    return { error: "Please provide a valid phone number." };
  }

  return { data };
}

async function sendContactEmail(req, res) {
  const { data, error } = validate(req.body);

  if (error) {
    return fail(res, 400, error);
  }

  const { RESEND_API_KEY, COMPANY_EMAIL, FROM_EMAIL } = process.env;

  if (!RESEND_API_KEY || !COMPANY_EMAIL) {
    console.error("Missing RESEND_API_KEY or COMPANY_EMAIL.");
    return fail(res, 500, "Server is not configured to send email.");
  }

  try {
    const html = await ejs.renderFile(TEMPLATE_PATH, data);

    const text = [
      "New Contact Form Submission",
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || "Not provided"}`,
      "",
      "Message:",
      data.message,
    ].join("\n");

    const { error: sendError } = await getResend().emails.send({
      from: FROM_EMAIL || "AK Kitchen Center <onboarding@resend.dev>",
      to: [COMPANY_EMAIL],
      replyTo: data.email,
      subject: `New Contact Enquiry from ${data.name}`,
      html,
      text,
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (err) {
    console.error("Contact email error:", err);
    return fail(res, 500, "Failed to send message. Please try again later.");
  }
}

module.exports = sendContactEmail;