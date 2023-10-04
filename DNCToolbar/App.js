var config = {
    
};
const pollingTime = 30000;//milliseconds
var token;

$(document).ready(function(){
	$("#errorMessage").hide();
    config = {
        "environment": "usw2.pure.cloud",
        "clientId":   getParameterByName('clientId', window.location.search),
        "redirectUri": "https://uriosteamarillo.github.io/DNCToolbar/index.html"

    };
    if(window.location.hash) 
    {	
        //config.environment = getParameterByName('environment', window.location.search);               
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
      
        
    }
    else
    {	
                
        
        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        }        
        
        console.log(config.environment)
        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }

});


function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};


function addNumberToDNC( phoneNumberToAdd) {
    let dnclist = '4ad47570-8427-458d-857a-5356fd055d6f';
    document.getElementById('result').text =" submitting"
    console.log(config)
    let url = "https://api." + config.environment + "/api/v2/outbound/dnclists/" + dnclist + "/phonenumbers";

    // Create the request body as an object
    const requestBody = {
        action:"add",
        phoneNumbers: [phoneNumberToAdd],
        "expirationDateTime": "" // Replace 'phoneNumberToAdd' with the actual phone number you want to add
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            
            url: url,
            type: "PATCH",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(requestBody), // Convert the object to JSON
            success: function (result) {
                document.getElementById('result').innerText  =" Number Submitted Correctly"
                console.log(result);
                // Handle success here
                resolve(result);
            },
            error: function (request) {
                console.log("addNumberToDNC-error", request);
                document.getElementById('result').innerText  ="Error Number not Submitted"
                // Handle errors here
                reject("addNumberToDNC -> " + JSON.stringify(request));
            }
        });
    });
}



function callNumber( phoneNumberToAdd) {
   
    document.getElementById('result').text =" calling"
    console.log(config)
    let url = "https://api." + config.environment + "/api/v2/conversations/calls";

    // Create the request body as an object
    const requestBody = {
        
        "callFromQueueId": "2fa48a75-8f26-4efd-8ebb-9a84d749f762",
        "phoneNumber": phoneNumberToAdd,
        };

    return new Promise((resolve, reject) => {
        $.ajax({
            
            url: url,
            type: "POST",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(requestBody), // Convert the object to JSON
            success: function (result) {
                document.getElementById('result').innerText  =" Call in Progress"
                console.log(result);
                // Handle success here
                resolve(result);
            },
            error: function (request) {
                console.log("addNumberToDNC-error", request);
                document.getElementById('result').innerText  ="CALL Error"
                // Handle errors here
                reject("addNumberToDNC -> " + JSON.stringify(request));
            }
        });
    });
}


