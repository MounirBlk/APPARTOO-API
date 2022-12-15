// tslint: disabled-next-line:no var-requires
const TSConsoleReporter = require("jasmine-ts-console-reporter");

jasmine.getEnv().clearReporters(); //clear default console reporter
jasmine.getEnv().addReporter(new TSConsoleReporter());

const myReporter = {
    jasmineStarted: function (suiteInfo: { totalSpecsDefined: string }) {
        console.log("Running suite with " + suiteInfo.totalSpecsDefined + " specs");
    },

    suiteStarted: function (result: { description: string; fullName: string }) {
        //console.log( "Suite started: " + result.description + " whose full description is: " + result.fullName);
    },

    specStarted: function (result: { description: string; fullName: string }) {
        //console.log( "Spec started: " +  result.description + " whose full description is: " + result.fullName );
    },

    specDone: function (result: { description: string; status: string; failedExpectations: string | any[]; passedExpectations: string | any[];}) {
        //console.log("Spec: " + result.description + " was " + result.status);

        for (var i = 0; i < result.failedExpectations.length; i++) {
            console.log("[START-ERROR-IT-TEST] " + result.description  + ' - ' + result.failedExpectations[i].message + " [END-ERROR-IT-TEST]" );
            //console.log(result.failedExpectations[i].stack);
        }
        //console.log(result.passedExpectations.length);
    },

    suiteDone: function (result: { description: string; status: string; failedExpectations: string | any[]; }) {
        console.log("\nSuite: " + result.description + " was " + result.status);
        for (var i = 0; i < result.failedExpectations.length; i++) {
            console.log("Suite " + result.failedExpectations[i].message);
            console.log(result.failedExpectations[i].stack);
        }
    },

    jasmineDone: function (result: { overallStatus: string;  failedExpectations: string | any[]; }) {
        console.log("Finished suite: " + result.overallStatus);
        for (var i = 0; i < result.failedExpectations.length; i++) {
            console.log("Global " + result.failedExpectations[i].message);
            console.log(result.failedExpectations[i].stack);
        }
    },
};

jasmine.getEnv().addReporter(<any>myReporter);
