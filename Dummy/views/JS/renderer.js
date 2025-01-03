const { ipcRenderer } = require("electron");
let selectedDirectory = ""; // Variable to store the selected directory folderLabel
const chooseDirButton = document.getElementById("chooseDirButton");
const submitButton = document.getElementById("submitButton");
const folderStatusElement = document.getElementById("statusMessage");
const folderLabel = document.getElementById("folderLabel");
const IpListContainer = document.getElementById("IpListContainer");
const sendButton = document.getElementById("SendButton");
let Database_module_version_name = ["DB Ver: _._._"];
const Database_version_name = document.getElementById("Database_version_name");

folderLabel.addEventListener("click", () => {
  // Simulate a click on the choose button
  chooseDirButton.click();
});
ipcRenderer.on("get-ip-addresses", (event, ipAddresses) => {
  // Clear the container before populating
  IpListContainer.innerHTML = "";
  if (ipAddresses.length === 0) {
    console.log("No IP addresses found.");
    return;
  }
  ipAddresses.forEach((ipData) => {
    createIpListItem(ipData, true);
  });
});

let selectedIps = [];
ipcRenderer.on("ip-status-update", (event, updatedIpData) => {
  // Clear the container before populating
  IpListContainer.innerHTML = "";

  if (updatedIpData.length === 0) {
    console.log("No IP addresses found.");
    return;
  }
  updatedIpData.forEach((ipData) => {
    createIpListItem(ipData, false);  
  });  
});


function createIpListItem(ipData, boolean) {
  const listItem = document.createElement("div");
  listItem.classList.add("IpBox");

  const card = document.createElement("div");
  card.classList.add("ip-card");

  // Create a container for the checkbox, label, status icon, and db text
  const itemContainer = document.createElement("div");
  itemContainer.classList.add("IpItemContainer");
     
  itemContainer.innerHTML = `
   <div class="IpContent">
      <div class="CheckboxContainer">
        <input type="checkbox" id="checkbox-${ipData.ip}" class="ip-checkbox">
        <label for="checkbox-${ipData.ip}">${ipData.alianceName}</label>
      </div>
      <div class="status-container">
        <div class="status-icon" id="status-${ipData.ip}"></div>
        <div class="db-text" id="db-text-${ipData.ip}"></div>
      </div>
    </div>
  `;

  card.appendChild(itemContainer);
  listItem.appendChild(card);

  IpListContainer.appendChild(listItem);

  const statusIcon = document.getElementById(`status-${ipData.ip}`);
  const checkbox = document.getElementById(`checkbox-${ipData.ip}`);
  const dbVersionText = document.getElementById(`db-text-${ipData.ip}`);

  // Update the status icon and static text based on the status
  updateStatusIcon(statusIcon, ipData.status);
  updateDbVersionText(
    dbVersionText,
    ipData.status,
    Database_module_version_name,
    ipData.ip
  ); // Set the DB static text
console.log(Database_module_version_name);
  updateCheckboxStatus(checkbox, ipData.status, ipData.ip); // Call this to update checkbox status based on IP status

  // Restore checkbox state if IP was previously selected
  if (selectedIps.includes(ipData.ip)) {
    checkbox.checked = true;
  }

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      if (!selectedIps.includes(ipData.ip)) {
        selectedIps.push(ipData.ip); // Add the IP to selectedIps list
      }
    } else {
      const index = selectedIps.indexOf(ipData.ip);
      if (index > -1) selectedIps.splice(index, 1); // Remove the IP from selectedIps list
    }

    ipcRenderer.send("selectedIps", selectedIps); // Send the updated list to main process
    console.log("Selected IPs:", selectedIps);
  });
}
function updateStatusIcon(statusIcon, status) {
  // Clear any existing content in the status icon container
  statusIcon.innerHTML = "";
     
  const img = document.createElement("img");

  // Set the image source based on the status
  if (status === "active") {
    img.src = "../assets/active.png"; // Path to your active image
    statusIcon.style.color = "green"; // Optional: keep the color if you want
  } else {
    img.src = "../assets/inactive.png"; // Path to your inactive image
    statusIcon.style.color = "red"; // Optional: keep the color if you want
  }

  // Optionally set some style for the image
  img.alt = status === "active" ? "Active" : "Inactive";
  img.style.width = "30px"; // Adjust size as needed
  img.style.height = "30px"; // Adjust size as needed

  // Append the image to the statusIcon container
  statusIcon.appendChild(img);
}
    

function updateDbVersionText(dbText, status, Database_module_version_name, ip) {
  console.log(Database_module_version_name);
    //  console.log(Database_module_version_name);
  if (status === "active") {
    if(ip === Database_module_version_name[0]){
      dbText.textContent = Database_module_version_name[1]; // Active DB text
    } else {
    dbText.textContent = "DB Ver: _._._"; // Inactive DB text
    }
  } else {
    dbText.textContent = "DB Ver: _._._"; // Inactive DB text
  }

}

// Function to update checkbox status and background based on the IP's status
function updateCheckboxStatus(checkbox, status, ip) {
  if (status === "active") {
    checkbox.disabled = false; // Enable checkbox if status is active 
    checkbox.style.backgroundColor = "white"; // Set background to white if active
  } else {
    checkbox.disabled = true; // Disable checkbox if status is not active
    checkbox.style.backgroundColor = "#ccc"; // Set background to gray if inactive
    if (checkbox.checked) {
      checkbox.checked = false; // Automatically uncheck if the status is inactive
    }
 
    // Remove the IP from selectedIps list if it becomes inactive
    const index = selectedIps.indexOf(ip);
    if (index > -1) selectedIps.splice(index, 1);
  }
}   
  

// Open the directory dialog when "Choose Directory" button is clicked
chooseDirButton.addEventListener("click", () => {
  ipcRenderer.send("choose-directory"); // Request the main process to open directory dialog
});

// Listen for the selected directory from the main process
ipcRenderer.on("selected-directory", (event, directory) => {
  selectedDirectory = directory; // Update the selected directory
 // console.log('Selected directory:', selectedDirectory);

  if (folderLabel) {
    folderLabel.textContent = `${selectedDirectory}`; // Update the folder label
  }
});
// Database_version_name;
          
ipcRenderer.on("Database_version_name", (event, version_name) => {
  console.log('Database_version_name', version_name[0]);
  Database_version_name.textContent = version_name[0];
})
  // Listen for the folder status from the main process
ipcRenderer.on("folder-status", (event, { isValid, missingFolders, formattedPath }) => {
  if (isValid) {
    // Folder is valid
    folderStatusElement.textContent = "Folder selected successfully";
    folderStatusElement.style.color = "White";
    sendButton.disabled = false; // Enable the Send button
    sendButton.style.backgroundColor = "#2196F3"; // Set background color to blue

    // Hide Database version name while folder status is visible
    Database_version_name.style.display = "none";
  } else {
    // Folder is invalid
    folderStatusElement.textContent = "Wrong Folder Selected";
    folderStatusElement.style.color = "red";
    sendButton.disabled = true; // Disable the Send button
    sendButton.style.backgroundColor = "#ccc"; // Set background color to grey

    // Hide Database version name while folder status is visible
    Database_version_name.style.display = "none";
  }

  // Send the formatted path
  folderLabel.textContent = formattedPath;

  // Clear the folder status message after 3 seconds
  setTimeout(() => {
    folderStatusElement.textContent = "";

    // Show the Database version name after the status disappears
    Database_version_name.style.display = "block"; 
  }, 3000);
});
sendButton.addEventListener("click", () => {
  // Check if any IP addresses are selected
  if (selectedIps.length === 0) {
   console.log("No IP addresses selected.");
    folderStatusElement.textContent = "Kindly choose an IP first...";
    return; // Prevent upload if no IP is selected
  }   

  // Check if the folder is valid by checking if the button is enabled
  if (sendButton.disabled) {
    console.log("Wrong folder selected.");
    folderStatusElement.textContent = "Please select a valid folder first.";
    folderStatusElement.style.color = "red";
    return; // Prevent upload if the folder is invalid
  }

  // Proceed with folder upload
  console.log("Upload folder triggered for:", selectedDirectory);
  ipcRenderer.send("upload-folder", { selectedIps, selectedDirectory });

  // Display a success message after the folder is uploaded (for debugging)
  folderStatusElement.textContent = "Folder uploaded successfully!";
  folderStatusElement.style.color = "White";

  // Clear the folder status message after 3 seconds
  setTimeout(() => {
    folderStatusElement.textContent = "";
  }, 3000);
});
// Database_version_name_module;

ipcRenderer.on("Database_version_name_module", (event, version_name) => {
  Database_module_version_name = version_name
  // console.log("Database_version_name_module", version_name);

});