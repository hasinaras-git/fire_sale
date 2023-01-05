const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { marked } = require('marked');
const fsPromise = require('fs/promises');
const { basename } = require('path');

const renderMarkdownToHtml = (markdown) => {
    // return marked(markdown, { sanitize: true })
    return marked.parse(markdown);
}

const getFileFromUser = async() => {
    const files = await dialog.showOpenDialog({
        properties: [ 'openFile' ],
        filters: [
            { name: "txt", extensions: [ 'txt', 'html' ] },
            { name: 'markdown', extensions: [ 'md', 'markdown' ] },
            { name: 'All Files', extensions: [ '*' ] }
        ]
    });
    let filePathSplited = files.filePaths[0].split('/');
    let fileName = filePathSplited[filePathSplited.length - 1];
   
    console.log(basename(path.join(files.filePaths[0])))

    if(!files.filePaths.length) { return; }
    const content = (await fsPromise.readFile(files.filePaths[0])).toString();

    // change the UI
    if(content) {
        let currentWindow = BrowserWindow.getAllWindows()
        currentWindow[0].webContents.send('file-opened', files.filePaths[0] ,content);
        
        // set window title
        if(currentWindow[0].title) {
            currentWindow[0].setTitle('Fire Sale');
        }
        currentWindow[0].setTitle(`${currentWindow[0].title} (${fileName})`)
        return content;
    }
}

let createWindow = () => {
    let mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    })
}

let windows = new Set();

let createNewWindow = () => {
    let newWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    newWindow.loadFile(path.join(__dirname, 'index.html'));
    newWindow.on('ready-to-show', () => {
        newWindow.show();
        if(BrowserWindow.getFocusedWindow()) {
            const [ xPos, yPos ] = newWindow.getPosition();
            newWindow.setPosition(xPos + 15, yPos + 15);
            newWindow.focus();
        }
    });

    windows.add(newWindow);
    newWindow.webContents.openDevTools();    

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    })
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('mdToHtml', (event, markdown) => {
        return renderMarkdownToHtml(markdown);
    })
    ipcMain.handle('get-file-from-user', getFileFromUser);
    ipcMain.handle('create-new-window', createNewWindow);

})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
})