const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { marked } = require('marked');
const fsPromise = require('fs/promises');
const { basename } = require('path');
const menu = require('./app-menu');

const renderMarkdownToHtml = (markdown) => {
    // return marked(markdown, { sanitize: true })
    return marked.parse(markdown);
}

const saveMarkdown = async(event, filePath, content) => {
    if(!filePath) {
        const file = await dialog.showSaveDialog({
            title: 'save markdown',
            defaultPath: path.join(app.getPath('documents')),
            filters: [
                { name: "markdown", extensions: [ "md" ] }
            ]
        })

        await fsPromise.writeFile(
            file.filePath,
            content,
            {
                encoding: 'utf-8'
            }
        );

        toggleEdited(null, false);
        BrowserWindow.getFocusedWindow().webContents.send('restore-current-content', content);
    } else {
        await fsPromise.writeFile(
            filePath,
            content,
            {
                encoding: 'utf-8'
            }
        );

        toggleEdited(null, false);
        BrowserWindow.getFocusedWindow().webContents.send('restore-current-content', content);
    }
}

const saveFileFromUser = async(event, content) => {
    const files = await dialog.showSaveDialog({
        title: "save HTML",
        // defaultPath: path.join("/home", "ihasina", "DesktopDev", "documents"),
        defaultPath: path.join(app.getPath('documents')),
        filters: [
            { name: "html", extensions: [ "html", "htm" ] }
        ]
    })
    if(!files) return;
    // console.log(files)
    await fsPromise.writeFile(
        files.filePath, 
        content, 
        { encoding: "utf-8" }
    )
    BrowserWindow.getFocusedWindow().webContents.send('restore-current-content', content);
    toggleEdited(null, false);
}

const getFileFromUser = async(event) => {
    const files = await dialog.showOpenDialog({
        properties: [ 'openFile' ],
        filters: [
            { name: "txt", extensions: [ 'txt', 'html' ] },
            { name: 'markdown', extensions: [ 'md', 'markdown' ] },
            { name: 'All Files', extensions: [ '*' ] }
        ]
    });
   
    // console.log(basename(path.join(files.filePaths[0])))

    if(!files.filePaths.length) { return; }

    let filePathSplited = files.filePaths[0].split('/');
    let fileName = filePathSplited[filePathSplited.length - 1];

    const content = (await fsPromise.readFile(files.filePaths[0])).toString();

    // change the UI
    if(content) {
        // let currentWindow = BrowserWindow.getAllWindows()
        const currentWindow = getCurrentWindow();
        currentWindow[0].webContents.send('file-opened', files.filePaths[0] ,content);
        appendRecentFileOpened(files.filePaths[0]);
        
        // set window title
        if(currentWindow[0].title) {
            // currentWindow[0].setTitle('Fire Sale');
            setWindowTitle(currentWindow[0], "Fire Sale")
        }
        // currentWindow[0].setTitle(`${currentWindow[0].title} (${fileName})`)
        setWindowTitle(currentWindow[0], `${currentWindow[0].title} (${fileName})`);
        return content;
    }
}

const appendRecentFileOpened = (filePath) => {
    const windowRef = getCurrentWindow();
    app.addRecentDocument(filePath);
}

const getCurrentWindow = () => {
    let currentWindow = BrowserWindow.getAllWindows();
    return currentWindow;
}

const setWindowTitle = (windowRef, title) => {
    windowRef.setTitle(title);
    
}

const toggleEdited = (event, isEdited) => {
    const [ currentWindow ] = BrowserWindow.getAllWindows();
    // console.log(BrowserWindow.getAllWindows());
    const isEditInclude = currentWindow.title.split(' ').includes('(edited)');
    if(isEdited) {
        if(!isEditInclude) {
            currentWindow.setTitle(`${currentWindow.title} (edited)`)
        }
    } else {
        const titleSplitted = currentWindow.title.split(' ');
        titleSplitted.splice([titleSplitted.length - 1], 1);
        currentWindow.setTitle(titleSplitted.join(' '));
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

    mainWindow.on('focus', () => console.log(mainWindow.getBounds()))
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

    newWindow.on('focus', () => console.log('newWindow is focused'))
}


app.whenReady().then(() => {
    createWindow();
    Menu.setApplicationMenu(menu);

    ipcMain.handle('mdToHtml', (event, markdown) => {
        return renderMarkdownToHtml(markdown);
    })
    ipcMain.handle('get-file-from-user', getFileFromUser);
    ipcMain.handle('create-new-window', createNewWindow);
    ipcMain.handle('file-is-edited', toggleEdited);
    ipcMain.handle('save-html', saveFileFromUser);
    ipcMain.on('save-markdown', saveMarkdown);

})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
})