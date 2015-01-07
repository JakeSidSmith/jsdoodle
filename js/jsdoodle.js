'use strict';

/* NOTES

localStorage.setItem(name, value);
*/

(function () {

  var editor, lineNumbers, runButton, iframe, iframeDocument;

  var addLineNumbers = function (number) {
    for (var i = 0; i < number; i += 1) {
      var li = document.createElement('li');

      var numbers = lineNumbers.getElementsByTagName('li');
      var value = 1;
      if (numbers.length) {
        value = parseInt(numbers[numbers.length - 1].textContent) + 1;
      }
      li.innerHTML = value;

      lineNumbers.insertBefore(li, undefined);
    }
  };

  var removeLineNumbers = function (number) {
    var numbers = lineNumbers.getElementsByTagName('li');
    for (var i = 0; i < number; i += 1) {
      numbers[numbers.length - 1].remove();
    }
  };

  var pushScriptToIframe = function () {
    iframeDocument.body.innerHTML = '';

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.innerHTML = editor.value;

    iframeDocument.body.insertBefore(script, undefined);
  };

  var shiftAndEnter = function (event) {
    if (event.keyCode === 13 && event.ctrlKey) {
      event.preventDefault();
      pushScriptToIframe();
    }
  };

  var editorChanged = function () {
    var lineCount = editor.value.split(/\n|\r|\r\n|\n\r/).length;
    var lineNumberCount = lineNumbers.getElementsByTagName('li').length;

    if (lineCount < lineNumberCount) {
      removeLineNumbers(lineNumberCount - lineCount);
    } else if (lineCount > lineNumberCount) {
      addLineNumbers(lineCount - lineNumberCount);
    }

    editor.style.paddingLeft = (lineNumbers.parentNode.offsetWidth + 8) + 'px';
  };

  var addEventListeners = function () {
    editor.addEventListener('scroll', function () {
      lineNumbers.style.marginTop = - editor.scrollTop + 'px';
    }, false);
    editor.addEventListener('change', editorChanged, false);
    editor.addEventListener('input', editorChanged, false);
    runButton.addEventListener('click', pushScriptToIframe);
    document.addEventListener('keypress', shiftAndEnter, false);
  };

  var jsdoodle = {
    init: function () {
      editor = document.getElementById('editor');
      lineNumbers = document.getElementById('line-numbers');
      runButton = document.getElementById('run-button');
      iframe = document.getElementById('frame');
      iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

      addEventListeners();

      // Initialize editor padding and subsequently add the first line number
      editorChanged();

      editor.focus();
    }
  };

  window.jsdoodle = jsdoodle;

})();
