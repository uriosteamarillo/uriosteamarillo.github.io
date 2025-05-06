var config = {};
var token;

$(document).ready(function(){
     $("#errorMessage").hide();

    $('#callBtn').on('click', function () {
        // Replace with real values or dynamically get them
        const queueId = 'c2d11d3a-d9f7-44ed-a3d4-3871adc69ea7';      // Optional
        const phoneNumber = $('#phoneInput').val(); // Get number from input
        const flowId = '96ef0374-31c8-45b1-b814-2472f46cac74';
        
        if (!phoneNumber || !phoneNumber.startsWith('+')) {
        alert('Please enter a valid phone number in E.164 format (e.g., +541112345678)');
        return;
       }
	document.getElementById('output').textContent = 'Processing';   
        checkPhoneNumber(token, flowId , phoneNumber)
          .then(flowExecutionId => {
        return pollFlowExecutionUntilComplete(token, flowExecutionId);
    })
    .then(outputData => {
        console.log("Flow Output Data:", outputData);

        // Example: render to HTML
        document.getElementById('output').textContent = JSON.stringify(outputData, null, 2);
    })
    .catch(err => {
        console.error("Error polling flow execution:", err);
    });
	    
    }); //  BOTON DE LLAMAR

	
    
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

function makeOutboundCall(token, phoneNumber, queueId) {
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

function checkPhoneNumber(token, flowId, phoneNumber) {
    const url = 'https://api.usw2.pure.cloud/api/v2/flows/executions';
     const outputDiv = document.getElementById("output");
        if (outputDiv && data.outputData) {
            outputDiv.innerText = "checking";
        }
    const body = {
        flowId: flowId,
        inputData: {
            "Flow.phonenumber": phoneNumber
        }
    };

    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Flow started:", data);
        return data.id;  // This is the flowExecutionId
    })
    .catch(err => {
        console.error("Error starting flow:", err);
    });

}
function getFlowExecutionDetails(token, flowExecutionId) {
    const url = `https://api.usw2.pure.cloud/api/v2/flows/executions/${flowExecutionId}`;

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch flow execution details');
        }
        return response.json();  // Parse the response to JSON
    })
    .then(data => {
        console.log("Flow Execution Details:", data);
        return data;  // Return the data so it can be used elsewhere
    })
    .catch(error => {
        console.error("Error:", error);
    });
}
function pollFlowExecutionUntilComplete(token, flowExecutionId, maxAttempts = 5, interval = 2000) {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        function checkStatus() {
            getFlowExecutionDetails(token, flowExecutionId)
                .then(data => {
                    const status = data.status;
                    console.log("Current Status:", status);

                    if (status === "Completed") {
                        resolve(data.outputData);  // When done, resolve with output data
                    } else {
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(checkStatus, interval); // Wait and retry
                        } else {
                            reject(new Error("Flow did not complete in time."));
                        }
                    }
                })
                .catch(err => reject(err));
        }

        checkStatus(); // Start polling
    });
}

//http://127.0.0.1:8887?environment=mypurecloud.com&clientId=94780cdf-ec5c-45b8-a637-c52f64fba3ef&redirectUri=http%3A%2F%2F127.0.0.1%3A8887%3Fenvironment%3Dmypurecloud.com

