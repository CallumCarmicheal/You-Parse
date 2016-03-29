var savedFileEntry = null;
function exportToFileEntry(fileEntry, text) {
    savedFileEntry = fileEntry;

    // Use this to get a file path appropriate for displaying
    chrome.fileSystem.getDisplayPath(fileEntry, function (path) {
        fileDisplayPath = path;
        console.log('Exporting to ' + path);
    });

    fileEntry.createWriter(function (fileWriter) {
        var truncated = false;
        var blob = new Blob([text]);

        fileWriter.onwriteend = function (e) {
            if (!truncated) {
                truncated = true;
                // You need to explicitly set the file size to truncate
                // any content that might have been there before
                this.truncate(blob.size);
                return;
            }
            console.log( 'Export to ' + fileDisplayPath + ' completed');
        };

        fileWriter.onerror = function (e) {
            console.log( 'Export failed: ' + e.toString() );
        };

        fileWriter.write(blob);

    });
}

var Tabs = {
    
    Enumeration: {
        /* ENUMERATIONS */
        SaveType: {
            USER_TITLE: "UT",
            TITLE_SPLIT: "TS"
        },

        SaveState: {
            SAVED: "OK",
            ERROR: "ER",
            PERM_ERROR: "PE",
            FILE_ERROR: "FE"
        },
    },
    
    Variables: {
        TabID: 0,
        SaveType: "",
        FileEntry: null
    },

    Methods: {
        isListenedTabRequest: function (packet, sendResponse) {
            var result = false;
            var tab = packet.Sender.tab;
            var tabID = tab.id;
            result = Tabs.Methods.Util.TabContains(tabID)

            var response = {
                Function:   "Tabs.ListenTo",
                Data:       { UseTab: result, TabID: tabID }
            };

            console.log("Tab Listen Request, RESP: ", result, "   Other Data, TabID: ", tab.id, ", Window ID: ", tab.windowId, ", Title: ", tab.title);
            sendResponse(response);
        },

        Util: {
            TabContains: function (id) {
                //return (Tabs.Variables.TabID == id);.
                return true;
            }
        },

        IO: {
            SaveTabRequest: function (packet, sendResponse) {
                /*  Request: {
                        Function: "Youtube.SaveSong"
                        Data: {
                            User: string
                            Title: string
                            VID: string
                        }
                    }       */
                var storage = chrome.storage.local;

                console.log("Saving Requested Tab with YT Data  ", packet.Request.Data, "   Tab ID: ", packet.Sender.tab.id);

                /*storage.set(packet.Request.Data, function () {
                    Tabs.Methods.IO.SavedTabRequest(Tabs.Enumeration.SaveState.SAVED, sendResponse);
                });*/
                exportToFileEntry(Tabs.Variables.FileEntry);
            },

            SavedTabRequest: function (state, sendResponse) {
                /* Response { 
                       Function: "Tabs.OnSaved",
                       Data: {
                            Status: enumeration.SaveState 
                       }
                   }*/
                var response = {
                    Function: "Tabs.OnSaved",
                    Data: { Status: state }
                }

                sendResponse(response);
            }
        },

        cctor: function() {
            console.log("You Parse (Background): First run!");
            console.log("You Parse (Background): Setting default values.");

            Tabs.Variables.TabID = 0;
            Tabs.Variables.SaveType = Tabs.Enumeration.SaveType.USER_TITLE;

            // Select default file
            Tabs.Variables.FileEntry = chrome.fileSystem.chooseEntry({
                type: 'saveFile',
                suggestedName: 'YouParse.txt',
                accepts: [{
                    description: 'Text files (*.txt)',
                    extensions: ['txt']
                }],
                acceptsAllTypes: true
            }, exportToFileEntry);
        }
    }

}


/*
    Request DATA: {
        Function: string
        Data: array
    }
 */
function ParseMessage(request, sender, sendResponse) {
    //console.log("ParseMessage: ", request, sender);

    if (sender.id != "ocifbiabifemlidgdijjmnboillceepn")
        return;

    var packet = {
        Sender: sender,
        Request: request
    }

    if (request.Function == "Tabs.ListenOn") {
        Tabs.Methods.isListenedTabRequest(packet, sendResponse);
    } else if (request.Function == "Youtube.SaveSong") {
        Tabs.Methods.IO.SaveTabRequest(packet, sendResponse);
    }
}

Tabs.Methods.cctor();
chrome.runtime.onMessage.addListener(ParseMessage);