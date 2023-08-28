var config = {};
const pollingTime = 300000;//milliseconds
var token;
var jsonString

$(document).ready(function(){
	$("#errorMessage").hide();
    
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
            "clientId": "65bddbb5-72f8-45f3-b507-dc68cbf5a938",
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
                const participant = result.entities[0].participants[0]; // Assuming you want data from the first participant
                const accountCode = participant.attributes.AccountCode;
                const remoteName = participant.attributes.RemoteName;
                const jsonContainer = document.getElementById("jsonContainer");
                jsonContainer.textContent = `AccountCode: ${accountCode}, RemoteName: ${remoteName}`;
              
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








function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
var button = document.getElementById("myButton");

        // Attach an event listener to the button
        button.addEventListener("click", async function () {
            try {
                // Call getActiveConversations and await the result
                const conversations = await getActiveConversations(token);
                // Do something with the result, e.g., display it on the page
                console.log(conversations);
            } catch (error) {
                console.error("Error:", error);
            }
        });
//http://127.0.0.1:8887?environment=mypurecloud.com&clientId=94780cdf-ec5c-45b8-a637-c52f64fba3ef&redirectUri=http%3A%2F%2F127.0.0.1%3A8887%3Fenvironment%3Dmypurecloud.com