var config = {};
var token;
var conversationId;

$(document).ready(function () {
    $("#errorMessage").hide();

    $('#callBtn').on('click', function () {
        const button = this;
        const queueId = $('#queueSelect').val();  // Capture it at the moment of interacti
        const phoneNumber = $('#phoneInput').val(); // Get number from input
        const flowId = '96ef0374-31c8-45b1-b814-2472f46cac74';

        if (!phoneNumber || !phoneNumber.startsWith('+')) {
            alert('Please enter a valid phone number in E.164 format (e.g., +541112345678)');
            return;
        }

        button.disabled = true;
        document.getElementById('output').textContent = 'Processing...';

        checkPhoneNumber(token, flowId, phoneNumber)
            .then(flowExecutionId => {
                return pollFlowExecutionUntilComplete(token, flowExecutionId);
            })
            .then(outputData => {
                console.log("Flow Output Data:", outputData);
                document.getElementById('output').textContent = JSON.stringify(outputData, null, 2);
                if (outputData["Flow.CanCall"] === true) {
                        makeOutboundCall(token, phoneNumber, queueId)
                        .then(response => {
                        console.log("Outbound call initiated:", response);
                        })
                            .catch(err => {
                        console.error("Error initiating outbound call:", err);
                    });
    } else {
        console.log("Cannot make call: CanCall is false or not set.");
    }
            })
            .catch(err => {
                console.error("Error during flow execution:", err);
                document.getElementById('output').textContent = 'Error occurred. See console for details.';
            })
            .finally(() => {
                button.disabled = false;
            });
    });


   // --- Button click handler ---
$('#shareToken').on('click', async function() {
    const button = this;
    if (!conversationId) {
        alert('No ConversationId.');
        return;
    }
    
    // Disable button to prevent double clicks
    button.disabled = true;
 

    try {
        const attributes = {};
        attributes[key] = value; // create dynamic key/value pair

        const result =  updateSecureAttributes(token, conversationId);
        console.log("Secure attributes updated:", result);
       
    } catch (error) {
        console.error("Error updating secure attributes:", error);
       
    } finally {
        button.disabled = false;
    }
});
   







    
    // OAuth & token parsing
    if (window.location.hash) {
        config.environment = getParameterByName('environment', window.location.search);
        token = getParameterByName('access_token', window.location.hash);
        conversationId = getParameterByName('conversationId', window.location.hash);
        location.hash = '';
        loadQueues(token);
    } else {
        config = {
            environment: "usw2.pure.cloud",
            clientId: getParameterByName('clientId', window.location.search), //"35a67a68-4cdb-4fff-a3ba-17a589e070a8",
            redirectUri: "https://uriosteamarillo.github.io/ClientApp/newInteraction.html?environment=usw2.pure.cloud"
        };

        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        };

        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }
});// ready document


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

                    if (status === "COMPLETED") {
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

function loadQueues(token) {
    const url = `https://api.${config.environment}/api/v2/routing/queues?pageSize=100&pageNumber=1`;

    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch queues');
        }
        return response.json();
    })
    .then(data => {
        const queueSelect = $('#queueSelect');
        queueSelect.empty(); // Clear any placeholder option

        data.entities.forEach(queue => {
            queueSelect.append(
                $('<option></option>')
                    .val(queue.id)
                    .text(queue.name)
            );
        });
    })
    .catch(error => {
        console.error("Error loading queues:", error);
        $('#queueSelect').html('<option value="">Failed to load queues</option>');
    });
}

 function updateSecureAttributes(token, conversationId) {
  const url = `https://api.${config.environment}/api/v2/conversations/${conversationId}/secureattributes`;

  const body = {
    sharedToken: token
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error updating secure attributes: ${errorText}`);
    }

    const result = await response.json();
    console.log('Secure attributes updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update secure attributes:', error);
  }
}



