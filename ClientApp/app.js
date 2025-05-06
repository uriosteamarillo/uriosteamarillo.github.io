var config = {};
var token;

$(document).ready(function(){
     $("#errorMessage").hide();

    $('#callBtn').on('click', function () {
        // Replace with real values or dynamically get them
        const phoneNumber = '+541112345678';  // E.164 format
        const queueId = 'c2d11d3a-d9f7-44ed-a3d4-3871adc69ea7';      // Optional
       
        makeOutboundCall(token, phoneNumber, queueId)
            .then(response => {
                console.log('Call initiated successfully:', response);
            })
            .catch(error => {
                console.error('Error initiating call:', error);
            });
    });

	
    
    if(window.location.hash) 
    {	
        config.environment = getParameterByName('environment', window.location.search);               
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
        
    }
    else
    {	
        //Config Genesys Cloud
        config = {
            "environment": "usw2.pure.cloud",
            "clientId": "35a67a68-4cdb-4fff-a3ba-17a589e070a8",
            "redirectUri": "https://uriosteamarillo.github.io/ClientApp/newInteraction.html?environment=usw2.pure.cloud"

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

function makeOutboundCall(token, phoneNumber, callFromQueueId) {
    const url = `https://api.${config.environment}/api/v2/conversations/calls`;

    const body = {
        phoneNumber: phoneNumber, // E.164 format recommended: e.g., "+541112345678"
        callFromQueueId: queueId // Optional. If provided, routes call via a queue
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(body),
            success: function (data) {
                console.log("Outbound call created:", data);
                resolve(data);
            },
            error: function (err) {
                console.error("Error making outbound call:", err);
                reject(err);
            }
        });
    });
}


//http://127.0.0.1:8887?environment=mypurecloud.com&clientId=94780cdf-ec5c-45b8-a637-c52f64fba3ef&redirectUri=http%3A%2F%2F127.0.0.1%3A8887%3Fenvironment%3Dmypurecloud.com

