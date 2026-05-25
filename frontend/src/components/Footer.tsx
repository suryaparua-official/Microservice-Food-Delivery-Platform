import { FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => (
  <footer
    style={{
      background: "#111",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "32px 24px 16px",
      marginTop: 40,
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 40,
          marginBottom: 24,
        }}
      >
        {/* Brand */}
        <div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#FF4D1C",
              letterSpacing: "-1px",
              marginBottom: 12,
            }}
          >
            zestify
            <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 34 }}>
              .
            </span>
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#555",
              lineHeight: 1.7,
              maxWidth: 260,
            }}
          >
            Food delivery, redefined. Fast, fresh, and reliable delivery from
            your favorite restaurants.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#f0f0f0",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Company
          </h4>
          {["About Us", "Careers", "Blog", "Press"].map((item) => (
            <p
              key={item}
              style={{
                fontSize: 13,
                color: "#555",
                marginBottom: 10,
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color =
                  "#FF4D1C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color = "#555";
              }}
            >
              {item}
            </p>
          ))}
        </div>

        {/* For Partners */}
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#f0f0f0",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Partners
          </h4>
          {[
            "Add Restaurant",
            "Become a Rider",
            "Partner Portal",
            "Help Center",
          ].map((item) => (
            <p
              key={item}
              style={{
                fontSize: 13,
                color: "#555",
                marginBottom: 10,
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color =
                  "#FF4D1C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color = "#555";
              }}
            >
              {item}
            </p>
          ))}
        </div>

        {/* Legal */}
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#f0f0f0",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Legal
          </h4>
          {[
            "Privacy Policy",
            "Terms of Service",
            "Cookie Policy",
            "Refund Policy",
          ].map((item) => (
            <p
              key={item}
              style={{
                fontSize: 13,
                color: "#555",
                marginBottom: 10,
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color =
                  "#FF4D1C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLParagraphElement).style.color = "#555";
              }}
            >
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ fontSize: 12, color: "#333" }}>
          © 2025 Zestify. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { Icon: FaTwitter, label: "Twitter" },
            { Icon: FaInstagram, label: "Instagram" },
            { Icon: FaLinkedinIn, label: "LinkedIn" },
          ].map(({ Icon, label }) => (
            <span
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "#444",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLSpanElement).style.color = "#FF4D1C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLSpanElement).style.color = "#444";
              }}
            >
              <Icon size={13} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
