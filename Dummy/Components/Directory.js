const { ipcMain, dialog } = require("electron");
const { checkIndexSysForZeroSize } = require("./VersionCheck");
const fs = require("fs");
const path = require("path");

const requiredSubfolders = [
  "index.sys",
  "videoadvertisementtime.txt",
  "add",
  "add2",
  "poster",
  "videos",
  "kidszone",
  "img",
  "music",
  "movies",
  "advertisment",
];

async function chooseDirectory(mainWindow) {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    const directoryPath = result.filePaths[0];
    mainWindow.webContents.send("directory-chosen", directoryPath);
    handleDirectorySelection(directoryPath, mainWindow);
  }
}

function handleDirectorySelection(selectedDirectory, mainWindow) {
  // Split the directory path into its individual folders
  const directoryParts = selectedDirectory.split(path.sep);

checkIndexSysForZeroSize(selectedDirectory, mainWindow);

  // Get the first two and last two parts of the path, replace the middle ones with '...'
  const formattedPath = `${directoryParts[0]}\\${directoryParts[1]}\\...\\${
    directoryParts[directoryParts.length - 2]
  }\\${directoryParts[directoryParts.length - 1]}`;

  // Check for missing subfolders
  const missingFolders = checkSubfolders(selectedDirectory);

  // Send the formatted directory path to the renderer
  mainWindow.webContents.send("selected-directory", formattedPath);

  // Send folder status along with the formatted path
  if (missingFolders.length === 0) {
    mainWindow.webContents.send("folder-status", {
      isValid: true,
      formattedPath: formattedPath,
    });
  } else {
    mainWindow.webContents.send("folder-status", {
      isValid: false,
      missingFolders: missingFolders,
      formattedPath: formattedPath,
    });
  }
}      

function checkSubfolders(directory) {
  try {
    // Read the folder names in the selected directory (case-insensitive)
    const folderNames = fs
      .readdirSync(directory)
      .map((name) => name.toLowerCase());

    // Check for missing required subfolders (case-insensitive)
    const missingFolders = requiredSubfolders.filter(
      (subfolder) => !folderNames.includes(subfolder.toLowerCase())
    );

    return missingFolders;
  } catch (error) {
    console.error("Error while checking subfolders:", error);
    return requiredSubfolders; // Return all folders as missing in case of error
  }
}

module.exports = {
  chooseDirectory,
  handleDirectorySelection,
  checkSubfolders,
};
