'use strict';

/* NOTES

localStorage.setItem(name, value);

*/

(function () {

  var editor, lineNumbers, runButton, iframe, iframeDocument, iframeWindow, jsConsole, consoleCopies, clearConsoleButton;

  var lineNumberCount = 0;

  // Faster innerHTML replacement
  var replaceHTML = function (element, html) {
    var oldElement = typeof el === 'string' ? document.getElementById(element) : element;
    /*@cc_on // Pure innerHTML is slightly faster in IE
    oldElement.innerHTML = html;
    return oldEl;
    @*/
    var newElement = oldElement.cloneNode(false);
    newElement.innerHTML = html;
    oldElement.parentNode.replaceChild(newElement, oldElement);
    /* Since we just removed the old element from the DOM, return a reference
    to the new element, which can be used to restore variable references. */
    return newElement;
  };

  var replaceLastNumbers = function (value, match, number) {
    var lastIndex = value.lastIndexOf(match);

    for (var i = 0; i < number; i += 1) {
      lastIndex = value.lastIndexOf(match, lastIndex - 1);
    }

    value = value.substring(0, lastIndex) + '<br />';

    return value;
  };

  var addLineNumbers = function (number) {
    var lineNumbersHTML = lineNumbers.innerHTML;

    for (var i = 0; i < number; i += 1) {
      var value = lineNumberCount + 1;
      lineNumbersHTML += value + '<br />';
      lineNumberCount += 1;
    }

    lineNumbers = replaceHTML(lineNumbers, lineNumbersHTML);
  };

  var removeLineNumbers = function (number) {
    lineNumbers = replaceHTML(lineNumbers, replaceLastNumbers(lineNumbers.innerHTML, '<br>', number));
    lineNumberCount -= number;
  };

  var pushToIframe = function () {
    iframeDocument.body.innerHTML = '';
    iframeDocument.head.innerHTML = '';

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.innerHTML = editor.value;

    iframeDocument.body.insertBefore(script, undefined);
  };

  var ctrlAndEnter = function (event) {
    if (event.ctrlKey && event.keyCode === 13) {
      event.preventDefault();
      pushToIframe();
    }
  };

  var editorChanged = function () {
    var lineCount = editor.value.split(/\n|\r|\r\n|\n\r/).length;

    if (lineCount < lineNumberCount) {
      removeLineNumbers(lineNumberCount - lineCount);
    } else if (lineCount > lineNumberCount) {
      addLineNumbers(lineCount - lineNumberCount);
    }

    editor.style.paddingLeft = (lineNumbers.parentNode.offsetWidth + 8) + 'px';
  };

  var handleRuntimeError = function (event) {
    iframeWindow.console.error(event.message);
  };

  var clearConsole = function () {
    jsConsole.innerHTML = '';
  };

  var addListeners = function () {
    editor.addEventListener('scroll', function () {
      lineNumbers.style.marginTop = - editor.scrollTop + 'px';
    }, false);
    editor.addEventListener('change', editorChanged);
    editor.addEventListener('input', editorChanged);
    runButton.addEventListener('click', pushToIframe);
    clearConsoleButton.addEventListener('click', clearConsole);
    window.addEventListener('keypress', ctrlAndEnter);
    iframeWindow.addEventListener('keypress', ctrlAndEnter);
    iframeWindow.addEventListener('error', handleRuntimeError);
  };

  var argsToArray = function (args) {
    return Array.prototype.slice.call(args, 0);
  };

  var overrideConsoleMethod = function (type) {
    consoleCopies[type] = iframeWindow.console[type];

    iframeWindow.console[type] = function () {
      var args = argsToArray(arguments);

      for (var i = 0; i <  args.length; i += 1) {
        var arg = args[i].toString();
        var log = document.createElement('p');
        log.setAttribute('class', type);
        log.innerHTML = arg;
        jsConsole.insertBefore(log, undefined);
      }

      jsConsole.scrollTop = jsConsole.scrollHeight;
      consoleCopies[type].apply(this, args);
    };
  };

  var overrideConsole = function () {
    consoleCopies = {};

    overrideConsoleMethod('log');
    overrideConsoleMethod('info');
    overrideConsoleMethod('warn');
    overrideConsoleMethod('error');
  };

  var jsdoodle = {
    init: function () {
      editor = document.getElementById('editor');
      lineNumbers = document.getElementById('line-numbers');
      runButton = document.getElementById('run-button');
      iframe = document.getElementById('iframe');
      jsConsole = document.getElementById('console');
      clearConsoleButton = document.getElementById('clear-console');
      iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      iframeWindow = iframe.contentWindow || iframe;

      overrideConsole();
      addListeners();

      // Initialize editor padding and subsequently add the first line number
      editorChanged();
      
      editor.focus();
    }
  };

  window.jsdoodle = jsdoodle;

})();
