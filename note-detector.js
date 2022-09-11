function NoteDetector() {

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var audioContext = null;
    var analyser = null;
    var mediaStreamSource = null;

    var rafID = null;
    var buflen = 2048;
    var buf = new Float32Array(buflen);

    var _stream = null;

    function error() {
        var event = new CustomEvent("noteDetector.userPermissionResponse", { detail: { success: false } });
        this.dispatchEvent(event);
    }

    function getUserMedia(dictionary, callback) {
        try {
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
            navigator.getUserMedia(dictionary, callback, error);
        } catch (e) {
            alert('getUserMedia threw exception :' + e);
        }
    }


    function gotStream(stream) {
        var event = new CustomEvent("noteDetector.userPermissionResponse", { detail: { success: true } });
        this.dispatchEvent(event);

        _stream = stream;
        // Create an AudioNode from the stream.
        mediaStreamSource = audioContext.createMediaStreamSource(stream);

        // Connect it to the destination.
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        mediaStreamSource.connect(analyser);
        updatePitch();
    }

    function updatePitch(time) {
        analyser.getFloatTimeDomainData(buf);
        var ac = autoCorrelate(buf, audioContext.sampleRate);

        if (ac == -1) {
            // NOT DETECTED
            // console.log("vague");
        } else {
            // DETECTED
            // console.log("confident");
            pitch = ac;
            var soundData = {};
            soundData.pitchRounded = Math.round(pitch);
            var noteNumber = noteFromPitch(pitch);
            // https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
            soundData.noteNumber = noteNumber;
            soundData.noteText = noteStrings[noteNumber % 12];

            // console.log(noteText);

            var detune = centsOffFromPitch(pitch, noteNumber);
            if (detune == 0) {
                // detuneElem.className = "";
                // detuneAmount.innerHTML = "--";
            } else {
                // if (detune == 0) {
                //     detuneElem.className = "";
                //     detuneAmount.innerHTML = "--";
                // } else {
                //     if (detune < 0)
                //         detuneElem.className = "flat";
                //     else
                //         detuneElem.className = "sharp";
                //     detuneAmount.innerHTML = Math.abs(detune);
                // }
            }

            soundData.detuneAmount = detune;//Math.abs(detune);

            var event = new CustomEvent("noteDetector.soundEvent", { detail: soundData });
            this.dispatchEvent(event);
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = window.webkitRequestAnimationFrame;
        rafID = window.requestAnimationFrame(updatePitch);
    }


    function autoCorrelate(buf, sampleRate) {
        // Implements the ACF2+ algorithm
        var SIZE = buf.length;
        var rms = 0;

        for (var i = 0; i < SIZE; i++) {
            var val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) // not enough signal
            return -1;

        var r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (var i = 0; i < SIZE / 2; i++)
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (var i = 1; i < SIZE / 2; i++)
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        var c = new Array(SIZE).fill(0);
        for (var i = 0; i < SIZE; i++)
            for (var j = 0; j < SIZE - i; j++)
                c[i] = c[i] + buf[j] * buf[j + i];

        var d = 0; while (c[d] > c[d + 1]) d++;
        var maxval = -1, maxpos = -1;
        for (var i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        var T0 = maxpos;

        var x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        a = (x1 + x3 - 2 * x2) / 2;
        b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function noteFromPitch(frequency) {
        var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    function frequencyFromNoteNumber(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function centsOffFromPitch(frequency, note) {
        return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
    }


    this.getLiveInput = function () {

        if (audioContext == null) {
            audioContext = new AudioContext();
        }

        getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, gotStream);
    }


    this.stopLiveInput = function () {

        _stream.getTracks().forEach(track => { track.stop() });

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame(rafID);
    }

}