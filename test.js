{
    "transactions": [
      {
        "id":1,
        "type": "FLIGHT",
        "status": "ISSUED",
        "airline": {
          "name": "Malaysia Airlines",
          "has_aftersale": true
        },
        "tags": []
      },
      { 
        "id":2,
        "type": "HOTEL",
        "status": "ISSUED"
        
      }
    ],
    "user": {
      "trip_stage": "POST_TRIP"
    },
  "requests": [
          {
             "id":2,
            "type": "CANCEL",
            "status": "DONE",
            "hidden": false,
            "has_priority": false
          },
          {
             "id":2,
            "type": "RESCHEDULING",
            "status": "CREATED",
            "task_name": "STATUS_WAITING_FOR_MINOR",
            "hidden": true,
            "has_priority": false
          }
        ]
  }