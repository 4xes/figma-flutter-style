//vars
const copyButton = document.querySelector('#copy');
const code = document.querySelector('#code');

const exportFontFamily = document.querySelector('#exportFontFamily');
const exportSizes = document.querySelector('#exportSizes');

copyButton.onclick = () => { copy(); };

code.addEventListener('input', function() {
    inputValidation()
  }, false);

exportFontFamily.addEventListener( 'change', function() {
    createStyle()
});

exportSizes.addEventListener( 'change', function() {
    createStyle()
});

function copy() {
  code.select();
  code.setSelectionRange(0, 99999); /*For mobile devices*/

  document.execCommand("copy");

  alert("Text is copied to the clipboard")
}

function alert(message) {
    parent.postMessage({ pluginMessage: {
        'type': 'alert',
        'message' : message
    } }, '*');
}

//form validation
function inputValidation() {
    copyButton.disabled = code.value === '';
}

//functions
function createStyle() {
    console.log(exportFontFamily.checked);
    parent.postMessage({ pluginMessage: {
        'type': 'create-style',
        'exportFontFamily': exportFontFamily.checked,
        'exportSizes': exportSizes.checked
    } }, '*');
}

function autoCreate() {
    createStyle()
}

//on load function
document.addEventListener("DOMContentLoaded", function() {
    autoCreate();
});

onmessage = (event) => {
    code.innerHTML = event.data.pluginMessage;
};
