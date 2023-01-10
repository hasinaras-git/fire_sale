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
document.addEventListener('dragstart', (event) => {
    event.preventDefault()
})

document.addEventListener('dragover', (event) => {
    event.preventDefault()
})

document.addEventListener('dragleave', (event) => {
    event.preventDefault()
})

document.addEventListener('drop', (event) => {
    event.preventDefault()
})

const getDraggedFile = (event) => {
    return event.dataTransfer.items[0]
}

const getDroppedFile = (event) => {
    return event.dataTransfer.files[0]
}

const fileTypeIsSupported = (file) => {
    return [ 'text/plain', 'text/markdown' ].includes(file.type)
}

// event listener for drag and drop
markdownView.addEventListener('dragover', (event) => {
    event.preventDefault();
    console.log(event)
    const file = getDraggedFile(event)
    // if(fileTypeIsSupported(file)) {
    //     console.log('supported')
    // } else {
    //     console.log('not supported')
    // }
})