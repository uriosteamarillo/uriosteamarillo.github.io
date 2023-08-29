var config = {};
const pollingTime = 300000;//milliseconds
var token;
var jsonString

$(document).ready(function(){

	$("#errorMessage").hide();

        let myClientApp = null;
    
        // Note: This manual check for query string is for backwards compatibility of this
        // deployed example.  In your own apps, you can assume the query param will be
        // provided by Genesys Cloud if you have configured it in your app's config.
        console.log('Starting OK')
        const envQueryParamName = 'pcEnvironment';
        const hostQueryParamName = 'gcHostOrigin';
        const targetEnvQueryParamName = 'gcTargetEnv';
        const locationSearch = (window && window.location && typeof window.location.search === 'string') ? window.location.search : '';
        const queryParams = new URLSearchParams(locationSearch);
        if (queryParams.get(hostQueryParamName) || queryParams.get(targetEnvQueryParamName)) {
            // Compute Genesys Cloud region from host origin
            myClientApp = new window.purecloud.apps.ClientApp({
                gcHostOriginQueryParam: hostQueryParamName,
                gcTargetEnvQueryParam: targetEnvQueryParamName
            });
            console.log('Settings OK')
            const onFocus = async evt => {
                console.log('On Focus')
                await getActiveConversations2();
                }
            const onBlur = async evt => { console.log('On Blur') }
            myClientApp.lifecycle.addBlurListener(onBlur);
            myClientApp.lifecycle.addFocusListener(onFocus);
        } else if (queryParams.get(envQueryParamName)) {
            // Compute Genesys Cloud region from pcEnvironment
            myClientApp = new window.purecloud.apps.ClientApp({ pcEnvironmentQueryParam: envQueryParamName });
        } else {
            // Use default Genesys Cloud region
            myClientApp = new window.purecloud.apps.ClientApp();
        }
      
        
    
    

    
    if(window.location.hash) 
    {	
        config.environment = "usw2.pure.cloud",              
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
        
        
    }
    else
    {	
        //Config Genesys Cloud
        config = {
            "environment": "usw2.pure.cloud",
            "clientId": getParameterByName('clientId', window.location.search),
            "redirectUri": "https://uriosteamarillo.github.io/InteractionDetails/index.html"

        };
        
        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        }        
        
        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }

});


function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

function getActiveConversations(token){
    

    console.log(token);
    let url = "https://api." + "usw2.pure.cloud" + "/api/v2/" + "conversations";
    let conversations = [];

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "GET",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',	
            success: function (result) {  
                
                console.log(JSON.stringify(result))
                const conversationData = result;
                if (conversationData.entities && conversationData.entities[0] && conversationData.entities[0].participants) {
                    // Accessing AccountCode and RemoteName from the first participant
                    const participant = conversationData.entities[0].participants[0]; // Assuming you want data from the first participant
                    const accountCode = participant.attributes && participant.attributes.AccountCode;
                    const remoteName = participant.attributes && participant.attributes.RemoteName;
                  
                    // Check if 'accountCode' and 'remoteName' are defined before displaying them
                    if (accountCode !== undefined && remoteName !== undefined) {
                      // Display the values in the HTML element with id "jsonContainer"
                      const jsonContainer = document.getElementById("jsonContainer");
                      jsonContainer.textContent = `AccountCode: ${accountCode}, RemoteName: ${remoteName}`;
                    } else {
                      // Handle the case where 'accountCode' or 'remoteName' is undefined
                      console.log("AccountCode or RemoteName is undefined.");
                      jsonContainer.textContent = ''
                    }
                  } else {
                    // Handle the case where 'entities' or 'participants' is undefined
                    console.log("Entities or participants are undefined.");
                    jsonContainer.textContent = ''
                  }
                //console.log(result.conversations, "getWaitingConversations - page: " + pageNumber);
                
                resolve(conversations);                
            },
            error: function (request) {
                console.log("getWaitingConversations-error", request);                
                reject("get-waiting-conversations -> " + JSON.stringify(request));

            }
        }); 
    });

}


       
 async function getActiveConversations2() {
            try {
                // Call getActiveConversations and await the result
                const conversations = await getActiveConversations(token);
                // Do something with the result, e.g., display it on the page
                console.log(conversations);
            } catch (error) {
                console.error("Error:", error);
            }
        };
        
     
         
        
        

        // Check if the iframe is in the viewport
    

     
        
        // Check the widget status every 10 seconds
        //setInterval(checkWidgetDisplayStatus, 10000);
//http://127.0.0.1:8887?environment=mypurecloud.com&clientId=94780cdf-ec5c-45b8-a637-c52f64fba3ef&redirectUri=http%3A%2F%2F127.0.0.1%3A8887%3Fenvironment%3Dmypurecloud.com