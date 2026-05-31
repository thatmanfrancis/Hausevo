import React from "react";

interface LoginAlertEmailProps {
  name: string;
  device: string;
  location: string;
  time: string;
}

const LoginAlertEmail: React.FC<LoginAlertEmailProps> = ({
  name,
  device,
  location,
  time,
}) => {
  const primaryColor = "#09090b"; // Zinc-950
  const secondaryColor = "#71717a"; // Zinc-500
  const backgroundColor = "#ffffff";
  const borderColor = "#e4e4e7"; // Zinc-200
  const nunitoFont = "'Nunito', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body, p, h1, h2, h3, span, div {
            font-family: ${nunitoFont} !important;
          }
        ` }} />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#f4f4f5",
        fontFamily: nunitoFont,
      }}>
        <div
          style={{
            backgroundColor: "#f4f4f5",
            padding: "40px 20px",
            fontFamily: nunitoFont,
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: backgroundColor,
              borderRadius: "16px",
              overflow: "hidden",
              border: `1px solid ${borderColor}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              fontFamily: nunitoFont,
            }}
          >
            {/* Header / Logo */}
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <img
                src="cid:hausevo_logo"
                alt="Hausevo Logo"
                style={{
                  height: "48px",
                  width: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>

            {/* Content */}
            <div style={{ padding: "40px 32px", fontFamily: nunitoFont }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: primaryColor,
                  margin: "0 0 16px 0",
                  textAlign: "center",
                  fontFamily: nunitoFont,
                }}
              >
                Security Alert
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: secondaryColor,
                  margin: "0 0 32px 0",
                  textAlign: "center",
                  fontFamily: nunitoFont,
                }}
              >
                Hello {name}, we detected a new login to your Hausevo account. 
                If this was you, you can safely ignore this email.
              </p>

              {/* Details Box */}
              <div
                style={{
                  backgroundColor: "#fafafa",
                  borderRadius: "12px",
                  padding: "24px",
                  border: `1px solid ${borderColor}`,
                  marginBottom: "32px",
                  fontFamily: nunitoFont,
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#a1a1aa",
                      display: "block",
                      marginBottom: "4px",
                      fontFamily: nunitoFont,
                    }}
                  >
                    Device / Browser
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: primaryColor,
                      fontFamily: nunitoFont,
                    }}
                  >
                    {device}
                  </span>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#a1a1aa",
                      display: "block",
                      marginBottom: "4px",
                      fontFamily: nunitoFont,
                    }}
                  >
                    Location
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: primaryColor,
                      fontFamily: nunitoFont,
                    }}
                  >
                    {location}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#a1a1aa",
                      display: "block",
                      marginBottom: "4px",
                      fontFamily: nunitoFont,
                    }}
                  >
                    Time
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: primaryColor,
                      fontFamily: nunitoFont,
                    }}
                  >
                    {time}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: secondaryColor,
                    margin: "0 0 24px 0",
                    fontFamily: nunitoFont,
                  }}
                >
                  If you did not authorize this login, please secure your account immediately.
                </p>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`}
                  style={{
                    display: "inline-block",
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    textDecoration: "none",
                    fontFamily: nunitoFont,
                  }}
                >
                  Reset Password
                </a>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "32px",
                backgroundColor: "#fafafa",
                borderTop: `1px solid ${borderColor}`,
                textAlign: "center",
                fontFamily: nunitoFont,
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "#a1a1aa",
                  margin: 0,
                  fontFamily: nunitoFont,
                }}
              >
                &copy; {new Date().getFullYear()} Hausevo. All rights reserved.
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#d4d4d8",
                  marginTop: "8px",
                  fontFamily: nunitoFont,
                }}
              >
                Luxury Real Estate Management Platform
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default LoginAlertEmail;
