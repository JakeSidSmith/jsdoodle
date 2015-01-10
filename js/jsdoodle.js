'use strict';

(function () {

  var editor,
  editorContainer,
  lineNumbers,
  runButton,
  settingsButton,
  iframeContainer,
  iframe,
  iframeDocument,
  iframeWindow,
  jsConsole,
  consoleCopies,
  clearConsoleButton,
  consoleToggle,
  errors;

  var errorCount = 0;
  var lineNumberCount = 0;

  var setErrorCount = function (value) {
    errorCount = value;
    if (errorCount) {
      errors.innerHTML = errorCount;
    } else {
      errors.innerHTML = '';
    }
  };

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

  var iframeLoaded = function () {
    iframe.removeEventListener('load', iframeLoaded);

    iframeWindow = iframe.contentWindow || iframe;
    iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

    addIframeListeners();
    overrideConsole();

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.innerHTML = editor.value;

    iframeDocument.body.insertBefore(script, undefined);
  };

  var pushToIframe = function () {
    if (localStorage) {
      localStorage.setItem('previousProject', editor.value);
    }

    iframe.addEventListener('load', iframeLoaded);

    iframeWindow.location.reload();
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

  var clearConsole = function () {
    setErrorCount(0);
    jsConsole.innerHTML = '';

    if (window.console.clear) {
      window.console.clear();
    }
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

      if (type === 'error') {
        setErrorCount(errorCount + 1);
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

  var handleRuntimeError = function (event) {
    event.preventDefault();
    var lineNumber = '';
    if (event.lineno) {
      lineNumber = ' at line: ' + event.lineno;
    } else if (event.lineNumber) {
      lineNumber = ' at line: ' + event.lineNumber;
    }
    iframeWindow.console.error(event.message + lineNumber);
  };

  var hasClass = function (element, className) {
    var classes = element.getAttribute('class').toLowerCase().split(/\s+/gi);
    return classes.indexOf(className.toLowerCase()) >= 0;
  };

  var removeClass = function (element, className) {
    var classes = element.getAttribute('class');
    var regEx = new RegExp('(\\s+|^)' + className + '(\\s+|$)', 'i');
    classes = classes.replace(regEx, '');
    element.setAttribute('class', classes);
  };

  var addClass = function (element, className) {
    var classes = element.getAttribute('class').toLowerCase().split(/\s+/gi);
    classes.push(className.toLowerCase());
    element.setAttribute('class', classes.join(' '));
  };

  var toggleConsole = function () {
    if (hasClass(iframeContainer, 'console-active')) {
      removeClass(iframeContainer, 'console-active');
    } else {
      addClass(iframeContainer, 'console-active');
    }
  };

  var toggleSettings = function () {
    if (hasClass(editorContainer, 'settings-active')) {
      removeClass(editorContainer, 'settings-active');
    } else {
      addClass(editorContainer, 'settings-active');
    }
  };

  var addIframeListeners = function () {
    iframeWindow.addEventListener('keypress', ctrlAndEnter);
    iframeWindow.addEventListener('error', handleRuntimeError);
  };

  var addListeners = function () {
    editor.addEventListener('scroll', function () {
      lineNumbers.style.marginTop = - editor.scrollTop + 'px';
    }, false);
    editor.addEventListener('change', editorChanged);
    editor.addEventListener('input', editorChanged);
    runButton.addEventListener('click', pushToIframe);
    settingsButton.addEventListener('click', toggleSettings);
    clearConsoleButton.addEventListener('click', clearConsole);
    window.addEventListener('keypress', ctrlAndEnter);
    consoleToggle.addEventListener('click', toggleConsole);
    addIframeListeners();
  };


  var jsdoodle = {
    init: function () {
      editor = document.getElementById('editor');
      editorContainer = document.getElementById('editor-container');
      lineNumbers = document.getElementById('line-numbers');
      runButton = document.getElementById('run-button');
      settingsButton = document.getElementById('settings-button');
      iframeContainer = document.getElementById('iframe-container');
      iframe = document.getElementById('iframe');
      jsConsole = document.getElementById('console');
      clearConsoleButton = document.getElementById('clear-console');
      consoleToggle = document.getElementById('console-toggle');
      errors = document.getElementById('errors');
      iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      iframeWindow = iframe.contentWindow || iframe;

      overrideConsole();
      addListeners();

      if (localStorage) {
        editor.value = localStorage.getItem('previousProject');
      }

      // Initialize editor padding and subsequently add the first line number
      editorChanged();

      editor.focus();
    }
  };

  window.jsdoodle = jsdoodle;

})();
