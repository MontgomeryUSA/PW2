## Walkthrough Source ##
Multiple video playlist from youtube
```
Hello World
https://www.youtube.com/watch?v=lu_awhEGxmY

PopUp Styling
https://www.youtube.com/watch?v=C-Mr5SftYTo

PopUp Logic
https://www.youtube.com/watch?v=r2V8MJLsUmI

```



### Turn On Developer Mode ###
```
In google chrome go to:
chrome://extensions

Make sure developer mode switch is turned on.
```

### Make a manifest for the extension ###
create manifest.json
```
{
    "name" : "Extension Name",
    "description" : "Simple description of extension",
    "version": "1.0",
    "manifest_version" : 3,
    "background" : {
        "service_worker" : "background.js"
    },
    "permissions" : ["storage"],
    "action" : {
        "default_popup" : "popup.html"
    }

}

```

### Load Unpacked Extension ###
```
-Go to chrome://extensions
-Click "Load Unpacked"
-Navigate to the folder with the manifest.json
-Click "Select Folder"
-You should see your extension loaded

```

### Create Background Worker ###
The background.js file can be used to do work in the background.  
This is used for any calculations, server/API calls.  
  
In the same folder as manifest.json, create background.js and add the following
```
chrome.runtime.onInstalled.addListener(() => {
    console.log("My Chrome Extension has been installed.");
});
```

To see prints to the console, click on the "service worker" link in the extension card.  
The standard console for internet won't show it. There is a specific console for the extension.

### Create Popup Window ###
Create the following files:
```
popup.html
popup.js
popup.css
```


### Code Walkthrough ###
```
getChatGPTResponseClient
This function sends a system task and a prompt to ChatGPT
The system task describes how Chat should behave.
The current task is:

 You are an expert prompt engineer. Your job is to evaluate and improve AI prompts.

        When given a prompt, you must respond with ONLY a valid JSON object — no markdown, no backticks, no explanation outside the JSON.

        The JSON must have exactly these keys:
        - "score": a number from 1 to 10 rating the original prompt's clarity, specificity, and effectiveness
        - "new_prompt": an improved version of the original prompt that is clearer, more specific, and more likely to get a great response
        - "feedback": a brief explanation of what was weak in the original and what was changed in the improved version
        - "clarity": a number from 1 to 100 rating how clear the original prompt is

        Example response format:
        {"score": 6, "new_prompt": "...", "feedback": "...", "clarity": 60}


Then in the updatePopupWithResponse function we take the String from Chat and parse it into a json object so we can access the information.

const obj = JSON.parse(responseText);
console.log(obj);

//responseText is a json object and we need to access the values in it
let score = obj.score; //an overall score from 1 to 10
let bestPrompt = obj.new_prompt; //the new prompt
let feedback = obj.feedback; //text feedback on the original prompt
let clarity = obj.clarity; //number from 0 to 100

Here you can use these variables to display anywhere on the pop up window based on your HTML

```


