import "../index.css";
import Providers from "@/components/Providers";
import NextLayout from "@/components/NextLayout";
import Script from "next/script";

export const viewport = {
  themeColor: "#012D76",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Global Sourcing and Procurement Consultancy | Verified Suppliers | EEC",
  description: "Elan Exports Consultancy (EEC) is a Singapore Headquartered sourcing consultancy connecting global buyers with verified manufacturers across India and Asia. Open-book costs. Factory-audited suppliers. Incorporated January 2025.",
  keywords: "India sourcing, Asia sourcing, export consultancy, supplier qualification, IEC GST verification, landed cost optimization, Singapore export firm, B2B sourcing",
  authors: [{ name: "Elan Exports Consultancy" }],
  alternates: {
    canonical: "https://eectrade.com/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ]
  },
  openGraph: {
    type: "website",
    siteName: "Elan Exports Consultancy",
    title: "Global Sourcing and Procurement Consultancy | Verified Suppliers | EEC",
    description: "Singapore Headquartered sourcing consultancy connecting global buyers with verified manufacturers across India and Asia. Incorporated January 2025.",
    url: "https://eectrade.com/",
    images: [
      {
        url: "https://eectrade.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elan Exports Consultancy, Singapore Headquartered sourcing for India and Asia",
      }
    ],
    locale: "en_SG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Sourcing and Procurement Consultancy | Verified Suppliers | EEC",
    description: "Singapore Headquartered sourcing consultancy connecting global buyers with verified manufacturers across India and Asia. Incorporated January 2025.",
    images: ["https://eectrade.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=Abril+Fatface&family=Mrs+Saint+Delafield&display=swap" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=Abril+Fatface&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet" />
        
        {/* Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Elan Exports Consultancy",
              "alternateName": ["EEC", "Elan Exports"],
              "legalName": "Elan Exports Consultancy Pte. Ltd.",
              "url": "https://eectrade.com/",
              "logo": "https://eectrade.com/eec-logo.png",
              "image": "https://eectrade.com/og-image.png",
              "description": "Elan Exports Consultancy (EEC) is a Singapore Headquartered sourcing consultancy connecting global buyers with verified manufacturers across India and Asia. Open-book costs. Factory-audited suppliers. Incorporated January 2025.",
              "foundingDate": "2025-01-13",
              "areaServed": [
                { "@type": "Place", "name": "North America" },
                { "@type": "Place", "name": "European Union" },
                { "@type": "Place", "name": "Middle East" },
                { "@type": "Place", "name": "Asia Pacific" }
              ],
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "SG",
                "addressLocality": "Singapore"
              },
              "contactPoint": [{
                "@type": "ContactPoint",
                "contactType": "sales",
                "email": "partners@eectrade.com",
                "availableLanguage": ["en"]
              }],
              "knowsAbout": [
                "International sourcing",
                "Supplier qualification",
                "Factory audits",
                "Landed cost optimization",
                "Export from India",
                "Asia supply chain"
              ],
              "sameAs": [
                "https://www.linkedin.com/company/elan-exports/",
                "https://www.instagram.com/elan_exports_consultancy/",
                "https://www.facebook.com/profile.php?id=61591311811743"
              ],
              "location": [
                { "@type": "Place", "name": "Singapore", "address": { "@type": "PostalAddress", "addressCountry": "SG" } },
                { "@type": "Place", "name": "Mumbai", "address": { "@type": "PostalAddress", "addressCountry": "IN", "addressLocality": "Mumbai" } },
                { "@type": "Place", "name": "Bengaluru", "address": { "@type": "PostalAddress", "addressCountry": "IN", "addressLocality": "Bengaluru" } }
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Elan Exports Consultancy",
              "url": "https://eectrade.com/",
              "inLanguage": "en"
            })
          }}
        />
      </head>
      <body>
        <Providers>
          <NextLayout>{children}</NextLayout>
        </Providers>
        
        {/* PostHog Snippet */}
        <Script id="posthog-init" strategy="afterInteractive">
          {`
            !(function (t, e) {
                var o, n, p, r;
                e.__SV ||
                    ((window.posthog = e),
                    (e._i = []),
                    (e.init = function (i, s, a) {
                        function g(t, e) {
                            var o = e.split(".");
                            2 == o.length && ((t = t[o[0]]), (e = o[1])),
                                (t[e] = function () {
                                    t.push(
                                        [e].concat(
                                            Array.prototype.slice.call(
                                                arguments,
                                                0,
                                            ),
                                        ),
                                    );
                                });
                        }
                        ((p = t.createElement("script")).type =
                            "text/javascript"),
                            (p.crossOrigin = "anonymous"),
                            (p.async = !0),
                            (p.src =
                                s.api_host.replace(
                                    ".i.posthog.com",
                                    "-assets.i.posthog.com",
                                ) + "/static/array.js"),
                            (r =
                                t.getElementsByTagName(
                                    "script",
                                )[0]).parentNode.insertBefore(p, r);
                        var u = e;
                        for (
                            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
                                u.people = u.people || [],
                                u.toString = function (t) {
                                    var e = "posthog";
                                    return (
                                        "posthog" !== a && (e += "." + a),
                                        t || (e += " (stub)"),
                                        e
                                    );
                                },
                                u.people.toString = function () {
                                    return u.toString(1) + ".people (stub)";
                                },
                                o =
                                    "init me ws ys ps bs capture je Di ks register register_once register_for_session unregister unregister_for_session Ps getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Es $s createPersonProfile Is opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing Ss debug xs getPageViewId captureTraceFeedback captureTraceMetric".split(
                                        " ",
                                    ),
                                n = 0;
                            n < o.length;
                            n++
                        )
                            g(u, o[n]);
                        e._i.push([i, s, a]);
                    }),
                    (e.__SV = 1));
            })(document, window.posthog || []);
            
            function initPostHog() {
                posthog.init("phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs", {
                    api_host: "https://us.i.posthog.com",
                    person_profiles: "identified_only",
                    session_recording: {
                        recordCrossOriginIframes: true,
                        capturePerformance: false,
                    },
                });
            }
            if (document.readyState === "complete") {
                (window.requestIdleCallback || setTimeout)(initPostHog);
            } else {
                window.addEventListener("load", function () {
                    (window.requestIdleCallback || setTimeout)(initPostHog);
                });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
