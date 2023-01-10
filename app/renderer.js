const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileBtn = document.querySelector('#new-file');
const openFileBtn = document.querySelector('#open-file');
const saveMarkedDownBtn = document.querySelector('#save-markdown');
const revertBtn = document.querySelector('#revert');
const saveHtmlBtn = document.querySelector('#save-html');
const showFileBtn = document.querySelector('#show-file');
const openInDefaultBtn = document.querySelector('#open-in-default');

let filePath = null;
let originalContent = '';

window.api.restoreCurrentContent(async(event, content) => {
    htmlView.innerHTML = content;
})

saveHtmlBtn.disabled = true;

saveMarkedDownBtn.addEventListener('click', async() => {
    await window.api.saveMarkdown(filePath, markdownView.value)
})

saveHtmlBtn.addEventListener('click', (event) => {
    window.api.saveHtml(htmlView.innerHTML);
    const currentContent = htmlView.innerHTML;
    htmlView.innerHTML = currentContent;
})


window.api.openedFile(async(event, file, content) => {
    filePath = file;
    originalContent = content;

    markdownView.value = content;
    htmlView.innerHTML = DOMPurify
        .sanitize(await window.api.renderMarkdownToHtml(content));
});

markdownView.addEventListener('keyup', async (event) => {
    const currentContent = event.target.value;
    htmlView.innerHTML = DOMPurify
        .sanitize(await window.api.renderMarkdownToHtml(currentContent))
    if(originalContent !== currentContent) {
        await window.api.openedFileIsEdited(true)
        saveHtmlBtn.disabled = false;
    } else {
        await window.api.openedFileIsEdited(false)
        saveHtmlBtn.disabled = true;
    }
})

openFileBtn.addEventListener('click', async () => {
    const content = await window.api.getFileFromUser();
    // console.log(content);
    if (content) {
        htmlView.innerHTML = DOMPurify
            .sanitize(await window.api.renderMarkdownToHtml(content))
    }
})

newFileBtn.addEventListener('click', () => {
    window.api.createNewWindow();
})

// implementing drag and drop

document.addEventListener('dragover', event => {
    event.preventDefault()
    event.stopPropagation()
})
document.addEventListener('dragstart', event => {
    event.preventDefault()
    event.stopPropagation()
})
document.addEventListener('drop', event => {
    event.preventDefault()
    event.stopPropagation()
})
markdownView.addEventListener('dragstart', event => {
    
    event.preventDefault();
    event.stopPropagation()
    console.log(event.dataTransfer)
    markdownView.classList.add('drag-over')


})

markdownView.addEventListener('drop', async(e) => {
    e.preventDefault();
    console.log(e.dataTransfer.files[0])
    if(fileTypeSupported(e.dataTransfer.files[0])) {
        markdownView.classList.remove('drag-over');
        await window.api.getFileFromUser();
    } else {
        
    }
    e.stopPropagation()
})

const fileTypeSupported = (file) =>  {
    const fileType = file.type;
    return [ 'text/plain', 'text/markdown' ].includes(fileType)
}