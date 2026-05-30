import React from "react";

interface WaitlistBroadcastEmailProps {
  name: string;
  subject: string;
  body: string;
  imageUrl?: string | null;
}

const nunitoFont = "'Nunito', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const primaryColor = "#09090b";
const secondaryColor = "#71717a";
const borderColor = "#e4e4e7";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shack.ng";

const WaitlistBroadcastEmail: React.FC<WaitlistBroadcastEmailProps> = ({
  name,
  subject,
  body,
  imageUrl,
}) => {
  // Convert plain text line breaks to paragraphs
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, "<br/>").trim())
    .filter(Boolean);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          * { font-family: ${nunitoFont} !important; box-sizing: border-box; }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4f4f5", fontFamily: nunitoFont }}>
        <div style={{ backgroundColor: "#f4f4f5", padding: "40px 20px", fontFamily: nunitoFont }}>
          <div style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            border: `1px solid ${borderColor}`,
            fontFamily: nunitoFont,
          }}>

            {/* ── Header ── */}
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                // borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <img
                src="cid:shack_logo"
                alt="Shack Logo"
                style={{
                  height: "48px",
                  width: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>

            {/* ── Optional image ── */}
            {imageUrl && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", lineHeight: 0 }}>
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: "280px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* ── Body ── */}
            <div style={{ padding: "36px 32px", fontFamily: nunitoFont }}>

              <p style={{
                fontSize: "15px",
                color: secondaryColor,
                margin: "0 0 6px 0",
                fontFamily: nunitoFont,
              }}>
                Hey {name},
              </p>

              <h1 style={{
                fontSize: "22px",
                fontWeight: "800",
                color: primaryColor,
                margin: "0 0 24px 0",
                fontFamily: nunitoFont,
                lineHeight: "1.3",
              }}>
                {subject}
              </h1>

              {/* Message paragraphs */}
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "15px",
                    lineHeight: "26px",
                    color: secondaryColor,
                    margin: "0 0 16px 0",
                    fontFamily: nunitoFont,
                  }}
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}

              {/* ── CTA ── */}
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <a
                  href={`${appUrl}/waitlist`}
                  style={{
                    display: "inline-block",
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    padding: "14px 36px",
                    borderRadius: "100px",
                    fontSize: "14px",
                    fontWeight: "700",
                    textDecoration: "none",
                    fontFamily: nunitoFont,
                  }}
                >
                  View your waitlist spot →
                </a>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: "24px 32px",
              backgroundColor: "#fafafa",
              borderTop: `1px solid ${borderColor}`,
              textAlign: "center",
              fontFamily: nunitoFont,
            }}>
              <p style={{ fontSize: "12px", color: "#a1a1aa", margin: "0 0 4px 0", fontFamily: nunitoFont }}>
                &copy; {new Date().getFullYear()} Shack Technologies Ltd. All rights reserved.
              </p>
              <p style={{ fontSize: "11px", color: "#d4d4d8", margin: "0 0 8px 0", fontFamily: nunitoFont }}>
                You&apos;re receiving this because you joined the Shack waitlist.
              </p>
              <a
                href={`${appUrl}/waitlist`}
                style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: nunitoFont, textDecoration: "underline" }}
              >
                Unsubscribe
              </a>
            </div>

          </div>
        </div>
      </body>
    </html >
  );
};

export default WaitlistBroadcastEmail;
