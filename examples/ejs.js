// const jexl = require("jexl");
import _ from "../node_modules/lodash";
import ejs from "../node_modules/ejs";
import moment from "../node_modules/moment";
import '../dist/jsoneditor';

document.addEventListener("DOMContentLoaded", (event) => {

  // promote imported libs to window scope
  window.EJS = ejs;
  window.moment = moment;
  window._ = _;

  const getDOBFromAge = (ageInYears) => {
    return moment()
      .subtract(ageInYears, "years")
      .subtract(Math.round(Math.random(364)), "days")
      .startOf("day")
      .format("YYYY-MM-DD");
  };

  const employeesDoc = {
    employees:
      [{
        first: "Sterling",
        last: "Archer",
        dob: getDOBFromAge(36),
        age:  36
      },
        {
          first: "Malory",
          last: "Archer",
          dob: getDOBFromAge(75),
          age: 75
        },
        {
          first: "Lana",
          last: "Kane",
          dob: getDOBFromAge(33),
          age: 33
        },
        {
          first: "Cyril",
          last: "Figgis",
          dob: getDOBFromAge(45),
          age: 45
        },
        {
          first: "Cheryl",
          last: "Tunt",
          dob: getDOBFromAge(28),
          age: 28
        }],
    retireAge: 62
  };
  // this is just to test that jexl and lodash are loaded and working -- should log 43.4
  // console.log(jexl.evalSync("employees|_(\"meanBy\",\"age\")", employeesDoc));

  // console.log(jexl.evalSync("inDate|moment('subtract', 1, 'year')|moment('toISOString')", { inDate: new Date() }));


// Initialize the editor with a JSON schema
  var editor = new JSONEditor(document.getElementById("editor_holder"), {
    "schema" : {
      "currentState": "New",
      "type": "object",
      "title": "Timesheet",
      "properties": {
        "Sequence-8twadSmjsFTPLpn6y": {
          "_id": "8twadSmjsFTPLpn6y",
          "type": "string",
          "title": "Sequence",
          "description": "This value is automatically generated",
          "format": "sequence",
          "readOnly": true,
          "required": true,
          "options": {
            "sequenceId": "DKv5iQ2asZuihnLqh",
            "placeholder": "[set automatically]",
            "hidden": true
          },
          "propertyOrder": 0
        },
        "Date-b3tdGzfashfHoRNfv": {
          "_id": "b3tdGzfashfHoRNfv",
          "type": "string",
          "title": "Entry Date",
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
          "title": "Lunch Break",
          "description": "30-minute lunch break",
          "format": "checkbox",
          "required": true,
          "propertyOrder": 76
        },
        "Text-NxWuTz4Bg6i4zrC3L": {
          "_id": "NxWuTz4Bg6i4zrC3L",
          "type": "string",
          "title": "Total Hours",
          "template": `
<%_
// EJS goes here
let hours = 0;
if (locals["EndTimeVal"] && locals["StartTimeVal"]) {
  const finishTime = moment(EndTimeVal, "HH:mm");
  const startTime = moment(StartTimeVal, "HH:mm");
  const duration = finishTime.diff(startTime);
  hours = +((duration / 1000 / 60 / 60).toFixed(2));
  if (!!locals["LunchBreakVal"]) {
    hours = hours - 0.5;
  }
}
_%>
<%= hours _%>
`,
          "watch": {
            "EndTimeVal":"Time-DjYudWTxQqnu7KjkY",
            "StartTimeVal":"Time-q96RbJREypkwDoxp3",
            "LunchBreakVal":"Checkbox-g6HFGjYDqnbtC6eT5"
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
    //             template: "<% if (typeof dob !== 'undefined') {%><%= moment().diff(dob, 'years') %><%}%>",
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
    //       "description": "This is generated automatically using ejs",
    //       "template": "<% if (typeof employees !== 'undefined') { %><%= _.meanBy(employees, 'age') %><% } %>",
    //       "watch": {
    //         "employees": "employees"
    //       }
    //     }
    //   }
    // },
    // startval: employeesDoc,
    template: 'ejs'
  });

// Hook up the submit button to log to the console
  document.getElementById("submit")
    .addEventListener("click", function () {
      // Get the value from the editor
      console.log(editor.getValue());
    });

});

