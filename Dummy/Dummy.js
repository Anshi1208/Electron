const fs = require("fs");
const path = require("path");

// Specify the path to the INDEX.SYS file
const filePath = path.join(__dirname, "./Components/INDEX.SYS");

// Arrays to store data for each column
const crcArray = [];
const sizeArray = [];
const filenameArray = [];

// Read the file
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  // Split the data into rows by newline
  const rows = data.split("\n");

  // Process each row to extract data
  rows.forEach((row) => {
    // Trim any extra spaces
    row = row.trim();

    // Skip empty lines
    if (row === "") return;

    // Split the row by whitespace (using regular expression to handle multiple spaces)
    const parts = row.split(/\s+/);

    // Ensure the row has 3 parts: CRC, SIZE, and FILENAME
    if (parts.length >= 3) {
      const crc = parts[0];
      const size = parts[1];
      const filename = parts.slice(2).join(" "); // Join the rest as filename

      // Push each value to its respective array
      crcArray.push(crc);
      sizeArray.push(size);
      filenameArray.push(filename);
//  console.log(filename);
      // Check if the size is "00000000" and log the filename
      if (size === "00000000") {
        console.log( filename);
      }
    }
  });

  // Log the stored arrays for CRC, SIZE, and FILENAME
  // console.log("CRC Array:", crcArray);
  // console.log("SIZE Array:", sizeArray);
  // console.log("FILENAME Array:", filenameArray);
});
