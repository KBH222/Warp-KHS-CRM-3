// User and Authentication Types
export var Role;
(function (Role) {
    Role["OWNER"] = "OWNER";
    Role["WORKER"] = "WORKER";
})(Role || (Role = {}));
// Job Types
export var JobStatus;
(function (JobStatus) {
    JobStatus["NOT_STARTED"] = "NOT_STARTED";
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["WAITING_ON_MATERIALS"] = "WAITING_ON_MATERIALS";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["ON_HOLD"] = "ON_HOLD";
})(JobStatus || (JobStatus = {}));
