//vars
const createStyleButton = document.querySelector('#createStyle');
const copyButton = document.querySelector('#copy');
const code = document.querySelector('#code');

//event listeners
createStyleButton.onclick = () => { createStyle(); };
copyButton.onclick = () => { copy(); };

if (code.addEventListener) {
  code.addEventListener('input', function() {
    inputValidation()
  }, false);
}

function copy() {
  code.select();
  code.setSelectionRange(0, 99999); /*For mobile devices*/

  document.execCommand("copy");

  alert("Code copied")
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
    parent.postMessage({ pluginMessage: {
        'type': 'create-style'
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
