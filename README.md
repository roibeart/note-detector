# Note detector

A framework-agnostic javascript library to detect notes in real time from the microphone of the device.

Based on the wonderful [PitchDetect](https://github.com/cwilso/PitchDetect) project by @cwilso

## How to use

1. Include the `note-detector.js` file in your project. 

2. Use the NoteDetector class in your code to detect the notes.

```javascript
var noteDetector = new NoteDetector();

noteDetector.getLiveInput(); // Starts capturing from the microphone

// listens for "noteDetector.soundEvent" events
window.addEventListener("noteDetector.soundEvent", function (e) {
    console.log(e.detail); // e.detail contains the data of the sound captured
});

noteDetector.stopLiveInput(); // Stops capturing sounds
```

### Sound data

The event captured has a `detail` property that contains data of the sound captured.

```json
{
    pitchRounded: 738,
    noteNumber: 78,
    noteText: "F#",
    detuneAmount: -6
}
```

`pitchRounded`: rounded value of the pitch

`noteNumber`: the corresponding midi value of the detected note

`noteText`: note name

`detuneAmount`: how much the sound captured is in tune with the note detected. The more the value is near 0, the more is in tune.

## Example

Check the index.html file for a working example.