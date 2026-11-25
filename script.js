
const ipAddress = document.getElementById("ipAddress");
const result = document.getElementById("result");
const error = document.getElementById("error");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");

// Convert decimal IP to binary
function convertIP() {

    const ip = ipAddress.value.trim();
    const octets = ip.split(".");

    error.textContent = "";

    // Check if the IP has exactly four octets
    if (octets.length !== 4) {
        error.textContent = "Please enter a valid IPv4 address.";
        return;
    }

    // Validate each octet
    const valid = octets.every(octet => {
        return /^\d+$/.test(octet) &&
               Number(octet) >= 0 &&
               Number(octet) <= 255;
    });

    if (!valid) {
        error.textContent =
            "Each octet must be a number between 0 and 255.";
        return;
    }

    // Convert each decimal octet into 8-bit binary
    const binary = octets.map(octet => {
        return Number(octet)
            .toString(2)
            .padStart(8, "0");
    });

    // Display the binary IP address
    result.textContent = binary.join(".");
}

// Copy the binary result
function copyResult() {

    const binary = result.textContent;

    navigator.clipboard.writeText(binary)
        .then(() => {
            alert("Binary address copied!");
        })
        .catch(() => {
            alert("Unable to copy the result.");
        });
}

// Button event listeners
convertBtn.addEventListener("click", convertIP);
copyBtn.addEventListener("click", copyResult);

// Allow conversion by pressing Enter
ipAddress.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        convertIP();
    }
});
