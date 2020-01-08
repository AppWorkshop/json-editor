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
    schema: {
      type: "object",
      title: "Employees",
      properties: {
        retireAge: {
          type: "integer"
        },
        employees: {
          type: "array",
          items: {
            type: "object",
            id: "employee_item",
            properties: {
              first: { type: "string" },
              last: { type: "string" },
              dob: { type: "string", format: "date", options: { flatpickr: {dateFormat: "Y-m-d"}} },
              age: {
                type: "integer",
                template: "<% if (typeof dob !== 'undefined') {%><%= moment().diff(dob, 'years') %><%}%>",
                watch: {
                  "dob": "employee_item.dob"
                }
              }
            }
          }
        },
        "averageAge": {
          "type": "number",
          "label": "Average Age",
          "description": "This is generated automatically using ejs",
          "template": "<% if (typeof employees !== 'undefined') { %><%= _.meanBy(employees, 'age') %><% } %>",
          "watch": {
            "employees": "employees"
          }
        }
      }
    },
    startval: employeesDoc,
    template: 'ejs'
  });

// Hook up the submit button to log to the console
  document.getElementById("submit")
    .addEventListener("click", function () {
      // Get the value from the editor
      console.log(editor.getValue());
    });

});

