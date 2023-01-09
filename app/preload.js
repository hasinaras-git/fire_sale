const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    renderMarkdownToHtml: (md) => ipcRenderer.invoke('mdToHtml', md),
    getFileFromUser: (event) => ipcRenderer.invoke('get-file-from-user', event),
    createNewWindow: () => ipcRenderer.invoke('create-new-window'),
    openedFile: (callback) => ipcRenderer.on('file-opened', callback),
    openedFileIsEdited: (isEdited) => ipcRenderer.invoke('file-is-edited', isEdited),
    saveHtml: (content) => ipcRenderer.invoke('save-html', content),
    restoreCurrentContent: (callback) => ipcRenderer.on('restore-current-content', callback),
    saveMarkdown: (path, content) => ipcRenderer.send('save-markdown', path, content)
})