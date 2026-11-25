
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

const subnetTableBody = document.getElementById("subnetTableBody");
const subnetCount = document.getElementById("subnetCount");


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
// CLASSFUL NETWORK PREFIX
// ===================================

function getClassfulPrefix(ip) {

    const firstOctet = Number(ip.split(".")[0]);

    if (firstOctet >= 1 && firstOctet <= 126) {
        return 8; // Class A
    }

    if (firstOctet >= 128 && firstOctet <= 191) {
        return 16; // Class B
    }

    if (firstOctet >= 192 && firstOctet <= 223) {
        return 24; // Class C
    }

    return null;
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
// GENERATE ALL SUBNETS
// ===================================

function generateAllSubnets(ip, prefixLength) {

    subnetTableBody.innerHTML = "";
    subnetCount.textContent = "Number of Subnets: -";

    const classfulPrefix = getClassfulPrefix(ip);

    if (classfulPrefix === null) {

        subnetTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Unsupported IPv4 address class.
                </td>
            </tr>
        `;

        return;
    }

    if (prefixLength < classfulPrefix) {

        subnetTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    CIDR prefix must be ${classfulPrefix} or higher
                    for this classful network.
                </td>
            </tr>
        `;

        return;
    }

    // Calculate the number of borrowed subnet bits
    const subnetBits = prefixLength - classfulPrefix;

    const subnetCountValue =
        1n << BigInt(subnetBits);

    // Maximum number of rows displayed
    const MAX_SUBNETS = 4096;

    if (subnetCountValue > BigInt(MAX_SUBNETS)) {

        subnetCount.textContent =
            `Number of Subnets: ${subnetCountValue.toString()}`;

        subnetTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Too many subnets to display at once.
                    Maximum display is ${MAX_SUBNETS}.
                </td>
            </tr>
        `;

        return;
    }

    // Number of IP addresses in each subnet
    const addressesPerSubnet =
        1n << BigInt(32 - prefixLength);

    const ipValue = ipToNumber(ip);

    // Create the classful network mask
    const classfulMask =
        (0xFFFFFFFFn << BigInt(32 - classfulPrefix)) &
        0xFFFFFFFFn;

    // Find the parent classful network
    const classfulNetwork = ipValue & classfulMask;

    subnetCount.textContent =
        `Number of Subnets: ${subnetCountValue.toString()}`;

    // Generate every subnet
    for (let i = 0n; i < subnetCountValue; i++) {

        const network =
            classfulNetwork + (i * addressesPerSubnet);

        const broadcast =
            network + addressesPerSubnet - 1n;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${(i + 1n).toString()}</td>
            <td>${numberToIP(network)}</td>
            <td>${numberToIP(broadcast)}</td>
        `;

        subnetTableBody.appendChild(row);
    }
}


// ===================================
// SUBNET MASK CALCULATOR
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

    subnetTableBody.innerHTML = `
        <tr>
            <td colspan="3">
                Enter an IPv4/CIDR to generate subnets.
            </td>
        </tr>
    `;

    subnetCount.textContent = "Number of Subnets: -";

    // Separate IP and CIDR
    const parts = input.split("/");

    if (parts.length !== 2) {

        maskError.textContent =
            "Enter an IPv4 address with CIDR notation, e.g. 172.16.0.0/18.";

        return;
    }

    const ip = parts[0];
    const prefix = parts[1];

    // Validate IPv4
    if (!isValidIPv4(ip)) {

        maskError.textContent =
            "Invalid IPv4 address.";

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

    const total =
        1n << BigInt(32 - prefixLength);

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

        first = network;
        last = network;
        usable = 1n;

    } else if (prefixLength === 31) {

        first = network;
        last = broadcast;
        usable = 2n;

    } else {

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


    // ===================================
    // GENERATE ALL SUBNET NETWORKS
    // ===================================

    generateAllSubnets(ip, prefixLength);
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
