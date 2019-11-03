// Checks whether both text areas are filled before enabling encrypt and decrypt buttons
$('#message, #key').on('keyup', function() {
    if($('#message').val() === "" || $("#key").val() === "") {
        $('#encrypt-btn').prop("disabled", true);
        $('#decrypt-btn').prop("disabled", true);
    } else if ($('#message').val() !== "" && $("#key").val() !== "") {
        $('#encrypt-btn').prop("disabled", false);
        $('#decrypt-btn').prop("disabled", false);
    }
});

function get_link(){
    const href = window.location.href.split('?')[0];
    const link = href + "?msg=" + encodeURIComponent($('#message').val());
    return link;
}

function reset_link(){
    link = get_link();
    link = link.split("?msg=")[0];
    history.pushState({
        id: 'home'
    }, 'HIDE-A-PASSWORD', link);
}

function clear_text(){
    $('#message').val("");
    $('#key').val("");
    $('#encrypt-btn').prop("disabled", true);
    $('#decrypt-btn').prop("disabled", true);
    $('#copy-btn').prop("disabled", true);
    reset_link();
}

function copy_link(){
    link = get_link();
    copyToClipboard(link);
}

// Taken from: https://stackoverflow.com/a/33928558
//
// Copies a string to the clipboard. Must be called from within an 
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+, 
// Firefox 42+, Safari 10+, Edge and IE 10+.
// IE: The clipboard feature may be disabled by an administrator. By
// default a prompt is shown the first time the clipboard is 
// used (per session).
function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

// Polyfill for URLSearchParams because IE doesn't have support for it :/
// https://github.com/jerrybendy/url-search-params-polyfill
(function (w) {

    w.URLSearchParams = w.URLSearchParams || function (searchString) {
        var self = this;
        self.searchString = searchString;
        self.get = function (name) {
            var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(self.searchString);
            if (results == null) {
                return null;
            }
            else {
                return decodeURI(results[1]) || 0;
            }
        };
    }

})(window)

// Polyfill for endsWith because IE also doesn't support this either :/
//https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
          position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
  }


$(document).ready(function(){
    // Take url param and insert it in the message box
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    if(msg && !msg.endsWith("?64b\n")){
        alert("Message is too long for Internet Explorer, please use a different browser.");
    } else {
        $('#message').val(msg);
    }
    
});