import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendOrderPlacedEmail = async (
  to: string,
  customerName: string,
  restaurantName: string,
  items: { name: string; quauntity: number; price: number }[],
  totalAmount: number,
  orderId: string,
) => {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ccc">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ccc;text-align:center">×${item.quauntity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ccc;text-align:right">₹${item.price * item.quauntity}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0d0d0d;font-family:Inter,Arial,sans-serif">
      <div style="max-width:520px;margin:40px auto;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
        
        <!-- Header -->
        <div style="background:#161616;padding:28px 32px;border-bottom:1px solid #2a2a2a">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#FF4D1C;letter-spacing:-1px">
            tomato<span style="color:rgba(255,77,28,0.35)">.</span>
          </h1>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <div style="background:#22c55e20;border:1px solid #22c55e40;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">🎉</span>
            <div>
              <p style="margin:0;font-size:16px;font-weight:700;color:#4ade80">Order Confirmed!</p>
              <p style="margin:4px 0 0;font-size:13px;color:#555">Your order has been placed successfully</p>
            </div>
          </div>

          <p style="color:#888;font-size:14px;margin:0 0 8px">Hi <strong style="color:#f0f0f0">${customerName}</strong>,</p>
          <p style="color:#666;font-size:13px;margin:0 0 24px;line-height:1.6">
            Your order from <strong style="color:#f0f0f0">${restaurantName}</strong> has been placed and the restaurant has been notified.
          </p>

          <!-- Order ID -->
          <div style="background:#0d0d0d;border-radius:10px;padding:12px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em">Order ID</p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#f0f0f0;font-family:monospace">#${orderId.slice(-8).toUpperCase()}</p>
          </div>

          <!-- Items table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#0d0d0d">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Item</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#FF4D1C15;border:1px solid #FF4D1C30;border-radius:10px;margin-bottom:24px">
            <span style="font-size:15px;font-weight:700;color:#f0f0f0">Total Amount</span>
            <span style="font-size:20px;font-weight:800;color:#FF4D1C">₹${totalAmount}</span>
          </div>

          <p style="color:#555;font-size:12px;margin:0;line-height:1.6">
            We'll notify you when your order is out for delivery. Track your order in the app.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
          <p style="margin:0;font-size:11px;color:#444">© 2025 Tomato. Food delivery, redefined.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Tomato 🍅" <${process.env.GMAIL_USER}>`,
    to,
    subject: `✅ Order Confirmed — ${restaurantName}`,
    html,
  });

  console.log(`📧 Order placed email sent to ${to}`);
};

export const sendOtpEmail = async (
  to: string,
  customerName: string,
  otp: string,
  restaurantName: string,
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0d0d0d;font-family:Inter,Arial,sans-serif">
      <div style="max-width:520px;margin:40px auto;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
        
        <!-- Header -->
        <div style="background:#161616;padding:28px 32px;border-bottom:1px solid #2a2a2a">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#FF4D1C;letter-spacing:-1px">
            tomato<span style="color:rgba(255,77,28,0.35)">.</span>
          </h1>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <div style="background:#3b82f620;border:1px solid #3b82f640;border-radius:12px;padding:16px 20px;margin-bottom:24px">
            <p style="margin:0;font-size:16px;font-weight:700;color:#60a5fa">🚀 Your order is on the way!</p>
            <p style="margin:4px 0 0;font-size:13px;color:#555">Delivery partner is heading to your location</p>
          </div>

          <p style="color:#888;font-size:14px;margin:0 0 8px">Hi <strong style="color:#f0f0f0">${customerName}</strong>,</p>
          <p style="color:#666;font-size:13px;margin:0 0 24px;line-height:1.6">
            Your order from <strong style="color:#f0f0f0">${restaurantName}</strong> has been picked up and is on the way to you.
          </p>

          <!-- OTP Box -->
          <div style="background:#FF4D1C10;border:2px solid #FF4D1C40;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:0.1em;font-weight:600">🔐 Delivery OTP</p>
            <p style="margin:0;font-size:52px;font-weight:800;color:#FF4D1C;letter-spacing:16px;font-family:monospace">${otp}</p>
            <p style="margin:12px 0 0;font-size:12px;color:#444">Valid for 10 minutes</p>
          </div>

          <div style="background:#f59e0b10;border:1px solid #f59e0b30;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:600">⚠️ Important</p>
            <p style="margin:6px 0 0;font-size:12px;color:#888;line-height:1.6">
              Share this OTP <strong>only</strong> with your delivery partner when they arrive at your doorstep. 
              Do not share with anyone else.
            </p>
          </div>

          <p style="color:#555;font-size:12px;margin:0;line-height:1.6">
            You can also view this OTP on your order tracking page in the app.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
          <p style="margin:0;font-size:11px;color:#444">© 2025 Tomato. Food delivery, redefined.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Tomato 🍅" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🚀 Your order is on the way! OTP: ${otp}`,
    html,
  });

  console.log(`📧 OTP email sent to ${to}`);
};
