export declare const API_BASE_URL: string;
export declare const API_ENDPOINTS: {
    readonly LOGIN: "/api/auth/login";
    readonly REGISTER: "/api/auth/register";
    readonly REFRESH: "/api/auth/refresh";
    readonly LOGOUT: "/api/auth/logout";
    readonly ME: "/api/auth/me";
    readonly CUSTOMERS: "/api/customers";
    readonly CUSTOMER_BY_ID: (id: string) => string;
    readonly CUSTOMER_SEARCH: "/api/customers/search";
    readonly CUSTOMER_JOBS: (id: string) => string;
    readonly JOBS: "/api/jobs";
    readonly JOB_BY_ID: (id: string) => string;
    readonly JOB_MATERIALS: (id: string) => string;
    readonly JOB_ASSIGN: (id: string) => string;
    readonly JOB_STATUS: (id: string) => string;
    readonly MATERIALS: "/api/materials";
    readonly MATERIAL_BY_ID: (id: string) => string;
    readonly MATERIALS_BULK_UPDATE: "/api/materials/bulk-update";
    readonly SYNC_STATUS: "/api/sync/status";
    readonly SYNC_PUSH: "/api/sync/push";
    readonly SYNC_PULL: "/api/sync/pull";
    readonly WORKER_TASKS: "/api/workers/tasks";
    readonly WORKERS_LIST: "/api/workers";
    readonly DASHBOARD_STATS: "/api/dashboard/stats";
};
export declare const STORAGE_KEYS: {
    readonly AUTH_TOKEN: "khs_auth_token";
    readonly REFRESH_TOKEN: "khs_refresh_token";
    readonly USER_DATA: "khs_user_data";
    readonly SYNC_QUEUE: "khs_sync_queue";
    readonly OFFLINE_DATA: "khs_offline_data";
    readonly LAST_SYNC: "khs_last_sync";
    readonly THEME: "khs_theme";
};
export declare const VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_PATTERN: RegExp;
    readonly PHONE_PATTERN: RegExp;
    readonly EMAIL_PATTERN: RegExp;
    readonly MAX_FILE_SIZE: number;
    readonly MAX_NOTES_LENGTH: 1000;
    readonly MAX_TITLE_LENGTH: 100;
};
export declare const MATERIAL_UNITS: readonly ["each", "box", "case", "feet", "yards", "meters", "inches", "gallons", "liters", "pounds", "kilograms", "hours", "days", "rolls", "sheets", "bags", "tons"];
export declare const JOB_STATUS_DISPLAY: {
    readonly NOT_STARTED: {
        readonly label: "Not Started";
        readonly color: "gray";
        readonly icon: "clock";
    };
    readonly IN_PROGRESS: {
        readonly label: "In Progress";
        readonly color: "blue";
        readonly icon: "wrench";
    };
    readonly WAITING_ON_MATERIALS: {
        readonly label: "Waiting on Materials";
        readonly color: "yellow";
        readonly icon: "package";
    };
    readonly COMPLETED: {
        readonly label: "Completed";
        readonly color: "green";
        readonly icon: "check";
    };
    readonly ON_HOLD: {
        readonly label: "On Hold";
        readonly color: "orange";
        readonly icon: "pause";
    };
};
export declare const ERROR_CODES: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly DUPLICATE_ENTRY: "DUPLICATE_ENTRY";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly CONFLICT: "CONFLICT";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly SYNC_ERROR: "SYNC_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
};
export declare const ERROR_MESSAGES: Record<string, string>;
export declare const PWA_CONFIG: {
    readonly APP_NAME: "KHS CRM";
    readonly APP_SHORT_NAME: "KHS";
    readonly APP_DESCRIPTION: "KHS Construction & Remodeling CRM";
    readonly THEME_COLOR: "#1e40af";
    readonly BACKGROUND_COLOR: "#ffffff";
    readonly START_URL: "/";
    readonly DISPLAY: "standalone";
    readonly ORIENTATION: "portrait";
};
export declare const CACHE_CONFIG: {
    readonly CACHE_NAME: "khs-crm-v1";
    readonly STATIC_CACHE_NAME: "khs-static-v1";
    readonly DYNAMIC_CACHE_NAME: "khs-dynamic-v1";
    readonly MAX_CACHE_AGE: number;
    readonly MAX_DYNAMIC_ITEMS: 50;
};
export declare const SYNC_CONFIG: {
    readonly AUTO_SYNC_INTERVAL: number;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly RETRY_DELAY: 1000;
    readonly BATCH_SIZE: 50;
    readonly CONFLICT_RESOLUTION: "SERVER_WINS";
};
export declare const UI_CONFIG: {
    readonly ITEMS_PER_PAGE: 20;
    readonly SEARCH_DEBOUNCE_MS: 300;
    readonly TOAST_DURATION_MS: 4000;
    readonly MIN_TOUCH_TARGET_SIZE: 48;
    readonly MAX_MOBILE_WIDTH: 768;
    readonly TRANSITIONS_ENABLED: true;
};
//# sourceMappingURL=index.d.ts.map