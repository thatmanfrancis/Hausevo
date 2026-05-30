import React from "react";

interface WaitlistConfirmEmailProps {
  name: string;
  position: number;
  role: string;
  lga: string | null;
  email: string;
}

const nunitoFont = "'Nunito', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const primaryColor = "#09090b";
const secondaryColor = "#71717a";
const borderColor = "#e4e4e7";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shack.ng";

const WaitlistConfirmEmail: React.FC<WaitlistConfirmEmailProps> = ({
  name,
  position,
  role,
  lga,
  email,
}) => {
  const roleLabel =
    role === "TENANT" ? "Tenant"
    : role === "LANDLORD" ? "Landlord"
    : "Tenant & Landlord";

  const nextSteps = [
    "We'll email you the moment we launch publicly",
    "Early waitlist members get priority access",
    "Zero agent fees — ever",
  ];

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
        <style dangerouslySetInnerHTML={{ __html: `
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
                borderBottom: `1px solid ${borderColor}`,
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

            {/* ── Position badge ── */}
            <div style={{
              backgroundColor: "#fafafa",
              borderBottom: `1px solid ${borderColor}`,
              padding: "28px 32px",
              textAlign: "center",
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                margin: "0 0 10px 0",
                fontFamily: nunitoFont,
              }}>
                Your waitlist position
              </p>
              <p style={{
                fontSize: "64px",
                fontWeight: "900",
                color: primaryColor,
                margin: 0,
                lineHeight: 1,
                fontFamily: nunitoFont,
              }}>
                #{position}
              </p>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "36px 32px", fontFamily: nunitoFont }}>

              <h1 style={{
                fontSize: "22px",
                fontWeight: "800",
                color: primaryColor,
                margin: "0 0 10px 0",
                fontFamily: nunitoFont,
              }}>
                You&apos;re on the list, {name}.
              </h1>
              <p style={{
                fontSize: "15px",
                lineHeight: "24px",
                color: secondaryColor,
                margin: "0 0 28px 0",
                fontFamily: nunitoFont,
              }}>
                We&apos;re building the most trusted property platform in Nigeria — no agents,
                no markups, every listing verified. You&apos;ll be among the first to get access
                when we launch.
              </p>

              {/* ── Details card ── */}
              <div style={{
                backgroundColor: "#fafafa",
                borderRadius: "12px",
                padding: "20px 24px",
                border: `1px solid ${borderColor}`,
                marginBottom: "28px",
                fontFamily: nunitoFont,
              }}>
                <DetailRow label="Joining as" value={roleLabel} />
                {lga && <DetailRow label="Preferred area" value={`${lga}, Lagos`} />}
                <DetailRow label="Launch city" value="Lagos (expanding to Abuja, PH & more)" last />
              </div>

              {/* ── What happens next — bullet list ── */}
              <p style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 14px 0",
                fontFamily: nunitoFont,
              }}>
                What happens next
              </p>

              <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: "28px" }}>
                <tbody>
                  {nextSteps.map((step, i) => (
                    <tr key={i}>
                      <td style={{ verticalAlign: "top", paddingBottom: "12px", width: "32px" }}>
                        <div style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: primaryColor,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                        }}>
                          <span style={{
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "800",
                            fontFamily: nunitoFont,
                            lineHeight: "22px",
                            display: "block",
                            width: "22px",
                            textAlign: "center",
                          }}>
                            {i + 1}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        verticalAlign: "top",
                        paddingBottom: "12px",
                        paddingLeft: "10px",
                        fontSize: "14px",
                        color: secondaryColor,
                        lineHeight: "22px",
                        fontFamily: nunitoFont,
                      }}>
                        {step}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── CTA ── */}
              <div style={{ textAlign: "center" }}>
                <a
                  href={`${appUrl}/waitlist?email=${encodeURIComponent(email)}`}
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
                  View your spot →
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
              <p style={{ fontSize: "11px", color: "#d4d4d8", margin: 0, fontFamily: nunitoFont }}>
                Verified properties. No agents, no markups.
              </p>
            </div>

          </div>
        </div>
      </body>
    </html>
  );
};

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 0 : "14px" }}>
      <span style={{
        fontSize: "10px",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        color: "#a1a1aa",
        display: "block",
        marginBottom: "3px",
        fontFamily: nunitoFont,
        fontWeight: "700",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "14px",
        fontWeight: "700",
        color: primaryColor,
        fontFamily: nunitoFont,
      }}>
        {value}
      </span>
    </div>
  );
}

export default WaitlistConfirmEmail;
