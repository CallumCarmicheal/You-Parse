function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    }); return vars;
}

var YouParse = {


    Enumeration: {
        SaveState: {
            SAVED: "OK",
            ERROR: "ER",
            PERM_ERROR: "PE",
            FILE_ERROR: "FE"
        },


        saveState_ToString(ss) {
            // Only returns SAVED for now so need to do rest atm.
            if (ss == YouParse.Enumeration.SaveState.SAVED) {
                return "Saved";
            }
        }
    },

    TabID: 0,

    Log: function(p) {
        console.log("YouParse: ", p);
    },

    getUploader: function() {
        var UploaderClass = "yt-user-info";
        var elem = document.getElementsByClassName(UploaderClass)[0].children[0];
        var UploaderName = elem.innerHTML.replace(/[^\x20-\x7E]/gmi, "");

        return UploaderName;
    },

    getTitle: function() {
        var TitleID = "eow-title";
        var elem = document.getElementById(TitleID);
        var VideoTitle = elem.innerHTML.replace(/[^\x20-\x7E]/gmi, "").trim();

        return VideoTitle;
    },

    Init: function () {
        YouParse.Log("Init -> Started"); {
            var request = {
                Function: "Tabs.ListenOn"
            };

            chrome.runtime.sendMessage(request, function (response) {
                /*  Response {
                        "Function": "Tabs.ListenTo"
                        "Data":     {
                            UseTab: true/false,
                            TabID: integer
                        }
                    }
                 */
                var TabID = response.Data.TabID;
                var UseTab = response.Data.UseTab;
                YouParse.Log("Save current tab: " + UseTab);

                YouParse.Log(response);


                YouParse.TabID = TabID;
                YouParse.Log("TabID <=> " + YouParse.TabID);

                if (UseTab)
                    YouParse.Start();
            });
        } YouParse.Log("Init <- Finished");
    },

    

    getURL: function() {
        return getUrlVars().v;
    },

    Start: function() {
        YouParse.Log("Start -> Called."); {
            var Title = YouParse.getTitle();
            var Uploader = YouParse.getUploader();
            var vID = YouParse.getURL();

            YouParse.Log("Title: " + Title);
            YouParse.Log("Uploader: " + Uploader);

            //alert(Title + "\n" + Uploader);

            // Send our save request

            /*  Request: {
                    Function: "Youtube.SaveSong" Data: {
                        User: string
                        Title: string
                    }
                }       */

            var request = {
                Function: "Youtube.SaveSong", Data: {
                    "User":     Uploader,
                    "Title":    Title,
                    "VID":      vID
                }
            };

            chrome.runtime.sendMessage(request, function (response) {
                /* Response { 
                       Function: "Tabs.OnSaved",
                       Status: enumeration.SaveState 
                   }*/

                YouParse.Log(
                    "Song Save State: " +
                    YouParse.Enumeration.saveState_ToString(response.Data.Status)
                );
            });
        } YouParse.Log("Start <- Finished");
    }
}

/* 
    ====================
    Youtube handler code 
    ====================
*/
function checkYoutubeAddress() {
    if ('/watch' === location.pathname) {
        YouParse.Init();
    }
}


(document.body || document.documentElement).addEventListener('transitionend',
  function (/*TransitionEvent*/ event) {
      if (event.propertyName === 'width' && event.target.id === 'progress') {
          checkYoutubeAddress();
      }
  }, true);

// After page load
checkYoutubeAddress();