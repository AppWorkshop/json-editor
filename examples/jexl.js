// const jexl = require("jexl");
import _ from "../node_modules/lodash";
import jexl from "../node_modules/jexl";
import moment from "../node_modules/moment";
import momentTransform from '../node_modules/moment-transform';
import '../dist/jsoneditor';

document.addEventListener("DOMContentLoaded", (event) => {

  // promote imported libs to window scope
  window.jexl = jexl;
  window.moment = moment;
  window._ = _;

  const getDOBFromAge = (ageInYears) => {
    return moment()
      .subtract(ageInYears, "years")
      .subtract(Math.round(Math.random(364)), "days")
      .startOf("day")
      .format("YYYY-MM-DD");
  };

  // const employeesDoc = {
  //   employees:
  //     [{
  //       first: "Sterling",
  //       last: "Archer",
  //       dob: getDOBFromAge(36),
  //       age:  36
  //     },
  //       {
  //         first: "Malory",
  //         last: "Archer",
  //         dob: getDOBFromAge(75),
  //         age: 75
  //       },
  //       {
  //         first: "Lana",
  //         last: "Kane",
  //         dob: getDOBFromAge(33),
  //         age: 33
  //       },
  //       {
  //         first: "Cyril",
  //         last: "Figgis",
  //         dob: getDOBFromAge(45),
  //         age: 45
  //       },
  //       {
  //         first: "Cheryl",
  //         last: "Tunt",
  //         dob: getDOBFromAge(28),
  //         age: 28
  //       }],
  //   retireAge: 62
  // };
  // this is just to test that jexl and lodash are loaded and working -- should log 43.4
  // console.log(jexl.evalSync("employees|_(\"meanBy\",\"age\")", employeesDoc));

  // console.log(jexl.evalSync("inDate|moment('subtract', 1, 'year')|moment('toISOString')", { inDate: new Date() }));


// Initialize the editor with a JSON schema
  var editor = new JSONEditor(document.getElementById("editor_holder"), {
    "schema" : {
      "currentState": "New",
      "type": "object",
      "title": "Timesheet Example",
      "properties": {
        "Date-b3tdGzfashfHoRNfv": {
          "_id": "b3tdGzfashfHoRNfv",
          "type": "string",
          "title": "Timesheet Entry Date",
          "format": "date",
          "required": true,
          "propertyOrder": 73,
          "options": {
            "flatpickr": {
              "dateFormat": "Y-m-d",
              "enableTime": false,
              "noCalendar": false,
              "mode": "single"
            }
          }
        },
        "Time-q96RbJREypkwDoxp3": {
          "_id": "q96RbJREypkwDoxp3",
          "type": "string",
          "title": "Start Time",
          "format": "time",
          "options": {
            "flatpickr": {
              "dateFormat": "H:i",
              "enableTime": true,
              "noCalendar": true,
              "mode": "single"
            }
          },
          "required": true,
          "propertyOrder": 74
        },
        "Time-DjYudWTxQqnu7KjkY": {
          "_id": "DjYudWTxQqnu7KjkY",
          "type": "string",
          "title": "End Time",
          "format": "time",
          "options": {
            "flatpickr": {
              "dateFormat": "H:i",
              "enableTime": true,
              "noCalendar": true,
              "mode": "single"
            }
          },
          "required": true,
          "propertyOrder": 75
        },
        "Checkbox-g6HFGjYDqnbtC6eT5": {
          "_id": "g6HFGjYDqnbtC6eT5",
          "type": "boolean",
          "title": "30min Lunch Break?",
          "format": "checkbox",
          "required": true,
          "propertyOrder": 76
        },
        "Text-NxWuTz4Bg6i4zrC3L": {
          "_id": "NxWuTz4Bg6i4zrC3L",
          "type": "string",
          "title": "Total Hours",
          "description": "This is calculated automatically using jexl",
          "readonly":true,
          // "template": `__now|moment('startOf','day')|moment('format','DD-MM-YYYY HH:mm:ss')`,
          "template": `(
            (
              time2|
                timeToEpochHHmm - 
              time1|
                timeToEpochHHmm
            ) / 1000 / 60 / 60 - 
            (lunchbreak?0.5:0)
          )|
            _('round',2)|
            _('defaultTo',0)`, // convert time2 to number, convert time1 to number, subtract them, convert to hours, round to 2 decimals. Default to 0.
          "watch": {
            "time2":"Time-DjYudWTxQqnu7KjkY",
            "time1":"Time-q96RbJREypkwDoxp3",
            "lunchbreak":"Checkbox-g6HFGjYDqnbtC6eT5"
          },
          "required": false,
          "propertyOrder": 77
        }
      }
    },
    // schema: {
    //   type: "object",
    //   title: "Employees",
    //   properties: {
    //     retireAge: {
    //       type: "integer"
    //     },
    //     employees: {
    //       type: "array",
    //       items: {
    //         type: "object",
    //         id: "employee_item",
    //         properties: {
    //           first: { type: "string" },
    //           last: { type: "string" },
    //           dob: { type: "string", format: "date", options: { flatpickr: {dateFormat: "Y-m-d"}} },
    //           age: {
    //             type: "integer",
    //             template: "__now|moment('diff', dob, 'years')",
    //             "description": "This is calculated automatically using jexl",
    //             watch: {
    //               "dob": "employee_item.dob"
    //             }
    //           }
    //         }
    //       }
    //     },
    //     "averageAge": {
    //       "type": "number",
    //       "label": "Average Age",
    //       "description": "This is calculated automatically using jexl",
    //       "template": "employees|_(\"meanBy\",\"age\")",
    //       "watch": {
    //         "employees": "employees"
    //       }
    //     }
    //   }
    // },
    // startval: employeesDoc,
    template: 'jexl'
  });

// Hook up the submit button to log to the console
  document.getElementById("submit")
    .addEventListener("click", function () {
      // Get the value from the editor
      console.log(editor.getValue());
    });

});

