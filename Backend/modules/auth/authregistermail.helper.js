const axios = require("axios");

const ZEPTO_API = "https://api.zeptomail.in/v1.1/email";

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      ZEPTO_API,
      {
        from: {
          address: "team@vidorahub.com",
          name: "VidoraHub Team",
        },
        to: [
          {
            email_address: {
              address: to,
              name: "User",
            },
          },
        ],
        subject,
        htmlbody: html,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Email error:", error.response?.data || error.message);
  }
};



const sendWelcomeEmail = async (email, name = "Creator") => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to VidoraHub</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#111;">VidoraHub</h2>
              <p style="margin:5px 0 0; color:#777; font-size:13px;">Built for Creators</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td>
              <h3 style="margin:0; color:#111;">Welcome aboard</h3>
              <p style="color:#555; font-size:14px;">Hi ${name},</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-top:10px;">
              <p style="color:#555; font-size:14px; line-height:1.6;">
                Thank you for joining <b>VidoraHub</b>. We’re genuinely happy to have you with us.
              </p>

              <p style="color:#555; font-size:14px; line-height:1.6;">
                You’re now part of a growing movement to build a strong <b>Indian creator ecosystem</b> 🇮🇳
                — where creators have more control, more opportunities, and a platform that truly supports them.
              </p>

              <p style="color:#555; font-size:14px;">
                Start exploring, uploading, and growing today
              </p>
            </td>
          </tr>

          <!-- Quote / Hook -->
          <tr>
            <td style="padding:20px 0;">
              <div style="background:#f1f3f5; padding:15px; border-radius:8px; text-align:center;">
                <p style="margin:0; font-size:14px; color:#111;">
                  “Made in India 🇮🇳 — Built for Indian Creators”
                </p>
              </div>
            </td>
          </tr>

          <!-- Support / Contact -->
          <tr>
            <td>
              <p style="font-size:14px; color:#111; margin:0;">
                Need help or have questions?
              </p>

              <p style="font-size:13px; color:#666; line-height:1.6;">
                Feel free to reach out to us anytime — we’re always here to help you grow.
              </p>
            </td>
          </tr>

          <!-- Social Links -->
          <tr>
            <td align="center" style="padding:15px 0;">
              
              <a href="https://www.instagram.com/adityavidorahub/" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#E1306C; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Instagram
              </a>

              <a href="https://www.linkedin.com/company/vidorahub/" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#0077b5; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 LinkedIn
              </a>

              <a href="https://x.com/SastaGamer34497" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Twitter
              </a>

              <a href="https://www.facebook.com/profile.php?id=61581182016818" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#1877f2; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Facebook
              </a>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="font-size:12px; color:#999; text-align:center;">
                Let’s build, grow, and create something impactful together
              </p>
              <p style="font-size:12px; color:#bbb; text-align:center;">
                — VidoraHub Team
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "Welcome to VidoraHub",
    html,
  });
};

const sendLoginEmail = async (email, name = "Sir/Madam") => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>VidoraHub Login</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#111; font-size:22px;">VidoraHub</h2>
              <p style="margin:5px 0 0; color:#777; font-size:13px;">Creator Platform</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td>
              <h3 style="margin:0; color:#111;">You're logged in</h3>
              <p style="color:#555; font-size:14px;">Hi ${name},</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-top:10px;">
              <p style="color:#555; font-size:14px; line-height:1.6;">
                You’ve successfully logged in to <b>VidoraHub</b>.
              </p>

              <p style="color:#555; font-size:14px;">
                If this was you, you're all set
              </p>

              <p style="color:#d9534f; font-size:13px;">
                If this wasn’t you, please secure your account immediately.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 0;">
              <hr style="border:none; border-top:1px solid #eee;" />
            </td>
          </tr>

          <!-- Feedback Section -->
          <tr>
            <td>
              <p style="font-size:14px; color:#111; margin:0;">
                We’d love your feedback
              </p>

              <p style="font-size:13px; color:#666; line-height:1.6;">
                Your feedback helps us improve VidoraHub and build a better experience for creators.
              </p>
            </td>
          </tr>

          <!-- Social Buttons -->
          <tr>
            <td align="center" style="padding:15px 0;">
              
              <a href="https://www.instagram.com/adityavidorahub/" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#E1306C; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Instagram
              </a>

              <a href="https://www.linkedin.com/company/vidorahub/" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#0077b5; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 LinkedIn
              </a>

              <a href="https://x.com/SastaGamer34497" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Twitter
              </a>

              <a href="https://www.facebook.com/profile.php?id=61581182016818" 
                 style="display:inline-block; margin:5px; padding:10px 14px; background:#1877f2; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">
                 Facebook
              </a>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="font-size:12px; color:#999; text-align:center;">
                Thanks for being part of VidoraHub
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "You logged in to VidoraHub",
    html,
  });
};
module.exports = { sendEmail, sendWelcomeEmail, sendLoginEmail };
