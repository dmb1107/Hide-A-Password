
    //          JavaScrypt  --  Main page support functions

    'use strict';

    //      For details, see http://www.fourmilab.ch/javascrypt/

    var loadTime = (new Date()).getTime();  // Save time page was loaded
    var key;                                // Key (byte array)
    var prng;                               // Pseudorandom number generator

    //  setKey  --  Set key from string or hexadecimal specification

    function setKey() {
        var s = encode_utf8($('#key').val());
        var i, kmd5e, kmd5o;

        if (s.length == 1) {
            s += s;
        }

        md5_init();
        for (i = 0; i < s.length; i += 2) {
            md5_update(s.charCodeAt(i));
        }
        md5_finish();
        kmd5e = byteArrayToHex(digestBits);

        md5_init();
        for (i = 1; i < s.length; i += 2) {
            md5_update(s.charCodeAt(i));
        }
        md5_finish();
        kmd5o = byteArrayToHex(digestBits);

        var hs = kmd5e + kmd5o;
        key =  hexToByteArray(hs);
        hs = byteArrayToHex(key);
    }

    /*  Generate a key from the pseudorandom number generator
        and stuff it in the key field.  The kind of key generated
        (text or hexadecimal) is determined by which box is checked
        below the key field.  */

    function Generate_key() {
        var i, j, k = "";

        var i, j, k = "";

        addEntropyTime();
        var seed = keyFromEntropy();

        var prng = new AESprng(seed);
        //  Text key
        var charA = ("A").charCodeAt(0);

        for (i = 0; i < 12; i++) {
            if (i > 0) {
                k += "-";
            }
            for (j = 0; j < 5; j++) {
                k += String.fromCharCode(charA + prng.nextInt(25));
            }
        }
    
        $('#key').val(k);
        prng = null;
    }

    function encrypt_text() {
        var v, i;

        setKey();

        addEntropyTime();
        prng = new AESprng(keyFromEntropy());
        var plaintext = encode_utf8($('#message').val());
        // plaintext = LZString.compress($('#message').val());

        //  Compute MD5 sum of message text and add to header

        md5_init();
        for (i = 0; i < plaintext.length; i++) {
            md5_update(plaintext.charCodeAt(i));
        }
        md5_finish();
        var header = "";
        for (i = 0; i < digestBits.length; i++) {
            header += String.fromCharCode(digestBits[i]);
        }

        //  Add message length in bytes to header

        i = plaintext.length;
        header += String.fromCharCode(i >>> 24);
        header += String.fromCharCode(i >>> 16);
        header += String.fromCharCode(i >>> 8);
        header += String.fromCharCode(i & 0xFF);

        /*  The format of the actual message passed to rijndaelEncrypt
            is:

                    Bytes       Content
                     0-15       MD5 signature of plaintext
                    16-19       Length of plaintext, big-endian order
                    20-end      Plaintext

            Note that this message will be padded with zero bytes
            to an integral number of AES blocks (blockSizeInBits / 8).
            This does not include the initial vector for CBC
            encryption, which is added internally by rijndaelEncrypt.

        */

        var ct = rijndaelEncrypt(header + plaintext, key, "CBC");
        v = armour_base64(ct);
        $('#message').val((v));
        prng = null;
        $('#copy-btn').prop("disabled", false);
        if(v.length > 1750) {
            alert("This is an abnormally large message. Ensure the recipient is NOT using Internet Explorer in order for them to load this message properly.");
        }
        var link = get_link();
        history.pushState({
            id: 'home'
        }, 'HIDE-A-PASSWORD', link);
    }

    //  Decrypt ciphertext with key, place result in plaintext field

    function decrypt_text() {
        $('#copy-btn').prop("disabled", true);
        var isValid = true;
        setKey();
        var ct = new Array(), kt;
        kt = 2;
        ct = disarm_base64($('#message').val());
        $('#message').val("");
        var result = rijndaelDecrypt(ct, key, "CBC");

        var header = result.slice(0, 20);
        result = result.slice(20);

        /*  Extract the length of the plaintext transmitted and
            verify its consistency with the length decoded.  Note
            that in many cases the decrypted messages will include
            pad bytes added to expand the plaintext to an integral
            number of AES blocks (blockSizeInBits / 8).  */

        var dl = (header[16] << 24) | (header[17] << 16) | (header[18] << 8) | header[19];
        if ((dl < 0) || (dl > result.length)) {
            // alert("Message (length " + result.length + ") truncated.  " +
                // dl + " characters expected.");
            // alert("Something went wrong, double check your message and key.");
            //  Try to sauve qui peut by setting length to entire message
            dl = result.length;
        }

        /*  Compute MD5 signature of message body and verify
            against signature in message.  While we're at it,
            we assemble the plaintext result string.  Note that
            the length is that just extracted above from the
            message, *not* the full decrypted message text.
            AES requires all messages to be an integral number
            of blocks, and the message may have been padded with
            zero bytes to fill out the last block; using the
            length from the message header elides them from
            both the MD5 computation and plaintext result.  */

        var i, plaintext = "";

        md5_init();
        for (i = 0; i < dl; i++) {
            plaintext += String.fromCharCode(result[i]);
            md5_update(result[i]);
        }
        md5_finish();

        for (i = 0; i < digestBits.length; i++) {
            if (digestBits[i] != header[i]) {
                alert("Message corrupted.  Checksum of decrypted message does not match.");
                isValid = false;
                break;
            }
        }
        //  That's it; plug plaintext into the result field
        if(isValid) {
            $('#message').val(decode_utf8(plaintext));
        }
        $('#link-btn').prop("disabled", true);
        reset_link();
    }
