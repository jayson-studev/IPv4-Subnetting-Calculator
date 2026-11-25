
const ipAddress = document.getElementById("ipAddress");
const result = document.getElementById("result");
const error = document.getElementById("error");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");

const cidrAddress = document.getElementById("cidrAddress");
const maskDecimal = document.getElementById("maskDecimal");
const maskBinary = document.getElementById("maskBinary");
const maskError = document.getElementById("maskError");
const maskBtn = document.getElementById("maskBtn");

const networkAddress = document.getElementById("networkAddress");
const broadcastAddress = document.getElementById("broadcastAddress");
const firstHost = document.getElementById("firstHost");
const lastHost = document.getElementById("lastHost");
const totalAddresses = document.getElementById("totalAddresses");
const usableHosts = document.getElementById("usableHosts");


// ===================================
// IPV4 VALIDATION
// ===================================

function isValidIPv4(ip) {

    const octets = ip.split(".");

    if (octets.length !== 4) {
        return false;
    }

    return octets.every(octet => {
        return /^\d+$/.test(octet) &&
               Number(octet) >= 0 &&
               Number(octet) <= 255;
    });
}


// ===================================
// IPV4 STRING TO 32-BIT INTEGER
// ===================================

function ipToNumber(ip) {

    const octets = ip.split(".").map(Number);

    return (
        (BigInt(octets[0]) << 24n) |
        (BigInt(octets[1]) << 16n) |
        (BigInt(octets[2]) << 8n) |
        BigInt(octets[3])
    );
}


// ===================================
// 32-BIT INTEGER TO IPV4 STRING
// ===================================

function numberToIP(number) {

    return [
        Number((number >> 24n) & 255n),
        Number((number >> 16n) & 255n),
        Number((number >> 8n) & 255n),
        Number(number & 255n)
    ].join(".");
}


// ===================================
// DECIMAL IP TO BINARY
// ===================================

function convertIP() {

    const ip = ipAddress.value.trim();

    error.textContent = "";

    if (!isValidIPv4(ip)) {
        error.textContent =
            "Please enter a valid IPv4 address.";
        return;
    }

    const octets = ip.split(".");

    const binary = octets.map(octet => {
        return Number(octet)
            .toString(2)
            .padStart(8, "0");
    });

    result.textContent = binary.join(".");
}


// ===================================
// SUBNET CALCULATOR
// ===================================

function calculateMask() {

    const input = cidrAddress.value.trim();

    maskError.textContent = "";

    // Reset subnet details
    networkAddress.textContent = "-";
    broadcastAddress.textContent = "-";
    firstHost.textContent = "-";
    lastHost.textContent = "-";
    totalAddresses.textContent = "-";
    usableHosts.textContent = "-";

    // Separate IP and CIDR
    const parts = input.split("/");

    if (parts.length !== 2) {
        maskError.textContent =
            "Enter an IPv4 address with CIDR notation, e.g. 171.30.0.0/23.";
        return;
    }

    const ip = parts[0];
    const prefix = parts[1];

    // Validate IPv4
    if (!isValidIPv4(ip)) {
        maskError.textContent = "Invalid IPv4 address.";
        return;
    }

    // Validate CIDR
    if (!/^\d+$/.test(prefix) ||
        Number(prefix) < 0 ||
        Number(prefix) > 32) {

        maskError.textContent =
            "CIDR prefix must be between 0 and 32.";
        return;
    }

    const prefixLength = Number(prefix);

    // ===================================
    // CREATE SUBNET MASK
    // ===================================

    const maskBits =
        "1".repeat(prefixLength) +
        "0".repeat(32 - prefixLength);

    const binaryOctets = maskBits.match(/.{8}/g);

    const decimalOctets = binaryOctets.map(binary => {
        return parseInt(binary, 2);
    });

    maskBinary.textContent = binaryOctets.join(".");
    maskDecimal.textContent = decimalOctets.join(".");


    // ===================================
    // CALCULATE NETWORK AND BROADCAST
    // ===================================

    const ipValue = ipToNumber(ip);

    const allBits = 32;

    const total = 1n << BigInt(allBits - prefixLength);

    const maskValue =
        prefixLength === 0
            ? 0n
            : (0xFFFFFFFFn << BigInt(32 - prefixLength)) &
              0xFFFFFFFFn;

    const network = ipValue & maskValue;

    const broadcast = network | (total - 1n);


    // ===================================
    // CALCULATE HOST RANGE
    // ===================================

    let first;
    let last;
    let usable;

    if (prefixLength === 32) {

        // /32 contains one individual IP address
        first = network;
        last = network;
        usable = 1n;

    } else if (prefixLength === 31) {

        // /31 is commonly used for point-to-point links
        first = network;
        last = broadcast;
        usable = 2n;

    } else {

        // Standard subnet host range
        first = network + 1n;
        last = broadcast - 1n;
        usable = total - 2n;
    }


    // ===================================
    // DISPLAY SUBNET DETAILS
    // ===================================

    networkAddress.textContent =
        numberToIP(network);

    broadcastAddress.textContent =
        numberToIP(broadcast);

    firstHost.textContent =
        numberToIP(first);

    lastHost.textContent =
        numberToIP(last);

    totalAddresses.textContent =
        total.toString();

    usableHosts.textContent =
        usable.toString();
}


// ===================================
// COPY BINARY IP
// ===================================

function copyResult() {

    navigator.clipboard.writeText(result.textContent)
        .then(() => {
            alert("Binary IP address copied!");
        })
        .catch(() => {
            alert("Unable to copy the result.");
        });
}


// ===================================
// EVENT LISTENERS
// ===================================

convertBtn.addEventListener("click", convertIP);

copyBtn.addEventListener("click", copyResult);

maskBtn.addEventListener("click", calculateMask);


// ENTER KEY
ipAddress.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        convertIP();
    }
});

cidrAddress.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        calculateMask();
    }
});
