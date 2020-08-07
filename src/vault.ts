/**
 * HashiCorp Vault API
 * 1.5.0
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
export const defaults: RequestOpts = {
    baseUrl: "/"
};
export const servers = {};
type Encoders = Array<(s: string) => string>;
export type RequestOpts = {
    baseUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string | undefined>;
} & Omit<RequestInit, "body" | "headers">;
type FetchRequestOpts = RequestOpts & {
    body?: string | FormData;
};
type JsonRequestOpts = RequestOpts & {
    body: object;
};
type MultipartRequestOpts = RequestOpts & {
    body: Record<string, string | Blob | undefined | any>;
};
export const _ = {
    async fetch(url: string, req?: FetchRequestOpts) {
        const { baseUrl, headers, fetch: customFetch, ...init } = {
            ...defaults,
            ...req
        };
        const href = _.joinUrl(baseUrl, url);
        const res = await (customFetch || fetch)(href, {
            ...init,
            headers: _.stripUndefined({ ...defaults.headers, ...headers })
        });
        if (!res.ok) {
            throw new HttpError(res.status, res.statusText, href);
        }
        return res.text();
    },
    async fetchJson(url: string, req: FetchRequestOpts = {}) {
        const res = await _.fetch(url, {
            ...req,
            headers: {
                ...req.headers,
                Accept: "application/json"
            }
        });
        return res && JSON.parse(res);
    },
    json({ body, headers, ...req }: JsonRequestOpts) {
        return {
            ...req,
            body: JSON.stringify(body),
            headers: {
                ...headers,
                "Content-Type": "application/json"
            }
        };
    },
    form({ body, headers, ...req }: JsonRequestOpts) {
        return {
            ...req,
            body: QS.form(body),
            headers: {
                ...headers,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
    },
    multipart({ body, ...req }: MultipartRequestOpts) {
        const data = new FormData();
        Object.entries(body).forEach(([name, value]) => {
            data.append(name, value);
        });
        return {
            ...req,
            body: data
        };
    },
    /**
     * Deeply remove all properties with undefined values.
     */
    stripUndefined<T>(obj: T) {
        return obj && JSON.parse(JSON.stringify(obj));
    },
    // Encode param names and values as URIComponent
    encodeReserved: [encodeURIComponent, encodeURIComponent],
    allowReserved: [encodeURIComponent, encodeURI],
    /**
     * Creates a tag-function to encode template strings with the given encoders.
     */
    encode(encoders: Encoders, delimiter = ",") {
        const q = (v: any, i: number) => {
            const encoder = encoders[i % encoders.length];
            if (typeof v === "object") {
                if (Array.isArray(v)) {
                    return v.map(encoder).join(delimiter);
                }
                const flat = Object.entries(v).reduce((flat, entry) => [...flat, ...entry], [] as any);
                return flat.map(encoder).join(delimiter);
            }
            return encoder(String(v));
        };
        return (strings: TemplateStringsArray, ...values: any[]) => {
            return strings.reduce((prev, s, i) => {
                return `${prev}${s}${q(values[i] || "", i)}`;
            }, "");
        };
    },
    /**
     * Separate array values by the given delimiter.
     */
    delimited(delimiter = ",") {
        return (params: Record<string, any>, encoders = _.encodeReserved) => Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => _.encode(encoders, delimiter) `${name}=${value}`)
            .join("&");
    },
    joinUrl(...parts: Array<string | undefined>) {
        return parts
            .filter(Boolean)
            .join("/")
            .replace(/([^:]\/)\/+/, "$1");
    }
};
/**
 * Functions to serialize query parameters in different styles.
 */
export const QS = {
    /**
     * Join params using an ampersand and prepends a questionmark if not empty.
     */
    query(...params: string[]) {
        const s = params.join("&");
        return s && `?${s}`;
    },
    /**
     * Serializes nested objects according to the `deepObject` style specified in
     * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#style-values
     */
    deep(params: Record<string, any>, [k, v] = _.encodeReserved): string {
        const qk = _.encode([s => s, k]);
        const qv = _.encode([s => s, v]);
        // don't add index to arrays
        // https://github.com/expressjs/body-parser/issues/289
        const visit = (obj: any, prefix = ""): string => Object.entries(obj)
            .filter(([, v]) => v !== undefined)
            .map(([prop, v]) => {
            const index = Array.isArray(obj) ? "" : prop;
            const key = prefix ? qk `${prefix}[${index}]` : prop;
            if (typeof v === "object") {
                return visit(v, key);
            }
            return qv `${key}=${v}`;
        })
            .join("&");
        return visit(params);
    },
    /**
     * Property values of type array or object generate separate parameters
     * for each value of the array, or key-value-pair of the map.
     * For other types of properties this property has no effect.
     * See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#encoding-object
     */
    explode(params: Record<string, any>, encoders = _.encodeReserved): string {
        const q = _.encode(encoders);
        return Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => {
            if (Array.isArray(value)) {
                return value.map(v => q `${name}=${v}`).join("&");
            }
            if (typeof value === "object") {
                return QS.explode(value, encoders);
            }
            return q `${name}=${value}`;
        })
            .join("&");
    },
    form: _.delimited(),
    pipe: _.delimited("|"),
    space: _.delimited("%20")
};
export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string, url: string) {
        super(`${url} - ${message} (${status})`);
        this.status = status;
    }
}
export type ApiResult<Fn> = Fn extends (...args: any) => Promise<infer T> ? T : never;
/**
 * Configure the AD server to connect to, along with password options.
 */
export async function getAdConfig(opts?: RequestOpts) {
    return await _.fetch("/ad/config", {
        ...opts
    });
}
/**
 * Configure the AD server to connect to, along with password options.
 */
export async function postAdConfig(body: {
    anonymous_group_search?: boolean;
    binddn?: string;
    bindpass?: string;
    case_sensitive_names?: boolean;
    certificate?: string;
    client_tls_cert?: string;
    client_tls_key?: string;
    deny_null_bind?: boolean;
    discoverdn?: boolean;
    formatter?: string;
    groupattr?: string;
    groupdn?: string;
    groupfilter?: string;
    insecure_tls?: boolean;
    last_rotation_tolerance?: number;
    length?: number;
    max_ttl?: number;
    password_policy?: string;
    request_timeout?: number;
    starttls?: boolean;
    tls_max_version?: "tls10" | "tls11" | "tls12" | "tls13";
    tls_min_version?: "tls10" | "tls11" | "tls12" | "tls13";
    ttl?: number;
    upndomain?: string;
    url?: string;
    use_pre111_group_cn_behavior?: boolean;
    use_token_groups?: boolean;
    userattr?: string;
    userdn?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/ad/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the AD server to connect to, along with password options.
 */
export async function deleteAdConfig(opts?: RequestOpts) {
    return await _.fetch("/ad/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Retrieve a role's creds by role name.
 */
export async function getAdCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/creds/${name}`, {
        ...opts
    });
}
export async function getAdLibrary({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/ad/library${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Check service accounts in to the library.
 */
export async function postAdLibraryManageNameCheckIn(name: string, body: {
    service_account_names?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/manage/${name}/check-in`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read a library set.
 */
export async function getAdLibraryName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}`, {
        ...opts
    });
}
/**
 * Update a library set.
 */
export async function postAdLibraryName(name: string, body: {
    disable_check_in_enforcement?: boolean;
    max_ttl?: number;
    service_account_names?: string[];
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete a library set.
 */
export async function deleteAdLibraryName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check service accounts in to the library.
 */
export async function postAdLibraryNameCheckIn(name: string, body: {
    service_account_names?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}/check-in`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Check a service account out from the library.
 */
export async function postAdLibraryNameCheckOut(name: string, body: {
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}/check-out`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Check the status of the service accounts in a library set.
 */
export async function getAdLibraryNameStatus(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/library/${name}/status`, {
        ...opts
    });
}
/**
 * List the name of each role currently stored.
 */
export async function getAdRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/ad/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage roles to build links between Vault and Active Directory service accounts.
 */
export async function getAdRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage roles to build links between Vault and Active Directory service accounts.
 */
export async function postAdRolesName(name: string, body: {
    service_account_name?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/ad/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage roles to build links between Vault and Active Directory service accounts.
 */
export async function deleteAdRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/ad/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getAdRotateRoot(opts?: RequestOpts) {
    return await _.fetch("/ad/rotate-root", {
        ...opts
    });
}
/**
 * Configure the access key and secret to use for RAM and STS calls.
 */
export async function getAlicloudConfig(opts?: RequestOpts) {
    return await _.fetch("/alicloud/config", {
        ...opts
    });
}
/**
 * Configure the access key and secret to use for RAM and STS calls.
 */
export async function postAlicloudConfig(body: {
    access_key?: string;
    secret_key?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/alicloud/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the access key and secret to use for RAM and STS calls.
 */
export async function deleteAlicloudConfig(opts?: RequestOpts) {
    return await _.fetch("/alicloud/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Generate an API key or STS credential using the given role's configuration.'
 */
export async function getAlicloudCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/alicloud/creds/${name}`, {
        ...opts
    });
}
/**
 * List the existing roles in this backend.
 */
export async function getAlicloudRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/alicloud/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read, write and reference policies and roles that API keys or STS credentials can be made for.
 */
export async function getAlicloudRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/alicloud/role/${name}`, {
        ...opts
    });
}
/**
 * Read, write and reference policies and roles that API keys or STS credentials can be made for.
 */
export async function postAlicloudRoleName(name: string, body: {
    inline_policies?: string;
    max_ttl?: number;
    remote_policies?: string[];
    role_arn?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/alicloud/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read, write and reference policies and roles that API keys or STS credentials can be made for.
 */
export async function deleteAlicloudRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/alicloud/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Authenticates an RAM entity with Vault.
 */
export async function postAuthAlicloudLogin(body: {
    identity_request_headers?: string;
    identity_request_url?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/alicloud/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles that are registered with Vault.
 */
export async function getAuthAlicloudRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/alicloud/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Create a role and associate policies to it.
 */
export async function getAuthAlicloudRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/alicloud/role/${role}`, {
        ...opts
    });
}
/**
 * Create a role and associate policies to it.
 */
export async function postAuthAlicloudRoleRole(role: string, body: {
    arn?: string;
    bound_cidrs?: string[];
    max_ttl?: number;
    period?: number;
    policies?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/alicloud/role/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Create a role and associate policies to it.
 */
export async function deleteAuthAlicloudRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/alicloud/role/${role}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Lists all the roles that are registered with Vault.
 */
export async function getAuthAlicloudRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/alicloud/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Log in with an App ID and User ID.
 */
export async function postAuthAppIdLogin(body: {
    app_id?: string;
    user_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/app-id/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Log in with an App ID and User ID.
 */
export async function postAuthAppIdLoginAppId(appId: string, body: {
    user_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/login/${appId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read mappings for app-id
 */
export async function getAuthAppIdMapAppId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/app-id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single app-id mapping
 */
export async function getAuthAppIdMapAppIdKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/app-id/${key}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single app-id mapping
 */
export async function postAuthAppIdMapAppIdKey(key: string, body: {
    display_name?: string;
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/app-id/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read/write/delete a single app-id mapping
 */
export async function deleteAuthAppIdMapAppIdKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/app-id/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read mappings for user-id
 */
export async function getAuthAppIdMapUserId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/user-id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single user-id mapping
 */
export async function getAuthAppIdMapUserIdKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/user-id/${key}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single user-id mapping
 */
export async function postAuthAppIdMapUserIdKey(key: string, body: {
    cidr_block?: string;
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/user-id/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read/write/delete a single user-id mapping
 */
export async function deleteAuthAppIdMapUserIdKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/app-id/map/user-id/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Issue a token based on the credentials supplied
 */
export async function postAuthApproleLogin(body: {
    role_id?: string;
    secret_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/approle/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles registered with the backend.
 */
export async function getAuthApproleRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function getAuthApproleRoleRoleName(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function postAuthApproleRoleRoleName(roleName: string, body: {
    bind_secret_id?: boolean;
    bound_cidr_list?: string[];
    local_secret_ids?: boolean;
    period?: number;
    policies?: string[];
    role_id?: string;
    secret_id_bound_cidrs?: string[];
    secret_id_num_uses?: number;
    secret_id_ttl?: number;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Register an role with the backend.
 */
export async function deleteAuthApproleRoleRoleName(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Impose secret_id to be presented during login using this role.
 */
export async function getAuthApproleRoleRoleNameBindSecretId(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bind-secret-id`, {
        ...opts
    });
}
/**
 * Impose secret_id to be presented during login using this role.
 */
export async function postAuthApproleRoleRoleNameBindSecretId(roleName: string, body: {
    bind_secret_id?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bind-secret-id`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Impose secret_id to be presented during login using this role.
 */
export async function deleteAuthApproleRoleRoleNameBindSecretId(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bind-secret-id`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Deprecated: Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function getAuthApproleRoleRoleNameBoundCidrList(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bound-cidr-list`, {
        ...opts
    });
}
/**
 * Deprecated: Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function postAuthApproleRoleRoleNameBoundCidrList(roleName: string, body: {
    bound_cidr_list?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bound-cidr-list`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Deprecated: Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function deleteAuthApproleRoleRoleNameBoundCidrList(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/bound-cidr-list`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Assign a SecretID of choice against the role.
 */
export async function postAuthApproleRoleRoleNameCustomSecretId(roleName: string, body: {
    cidr_list?: string[];
    metadata?: string;
    secret_id?: string;
    token_bound_cidrs?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/custom-secret-id`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Enables cluster local secret IDs
 */
export async function getAuthApproleRoleRoleNameLocalSecretIds(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/local-secret-ids`, {
        ...opts
    });
}
/**
 * Updates the value of 'period' on the role
 */
export async function getAuthApproleRoleRoleNamePeriod(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/period`, {
        ...opts
    });
}
/**
 * Updates the value of 'period' on the role
 */
export async function postAuthApproleRoleRoleNamePeriod(roleName: string, body: {
    period?: number;
    token_period?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/period`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Updates the value of 'period' on the role
 */
export async function deleteAuthApproleRoleRoleNamePeriod(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/period`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Policies of the role.
 */
export async function getAuthApproleRoleRoleNamePolicies(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/policies`, {
        ...opts
    });
}
/**
 * Policies of the role.
 */
export async function postAuthApproleRoleRoleNamePolicies(roleName: string, body: {
    policies?: string[];
    token_policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/policies`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Policies of the role.
 */
export async function deleteAuthApproleRoleRoleNamePolicies(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/policies`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Returns the 'role_id' of the role.
 */
export async function getAuthApproleRoleRoleNameRoleId(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/role-id`, {
        ...opts
    });
}
/**
 * Returns the 'role_id' of the role.
 */
export async function postAuthApproleRoleRoleNameRoleId(roleName: string, body: {
    role_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/role-id`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a SecretID against this role.
 */
export async function getAuthApproleRoleRoleNameSecretId(roleName: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Generate a SecretID against this role.
 */
export async function postAuthApproleRoleRoleNameSecretId(roleName: string, body: {
    cidr_list?: string[];
    metadata?: string;
    token_bound_cidrs?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function postAuthApproleRoleRoleNameSecretIdAccessorDestroy(roleName: string, body: {
    secret_id_accessor?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-accessor/destroy`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthApproleRoleRoleNameSecretIdAccessorDestroy(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-accessor/destroy`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthApproleRoleRoleNameSecretIdAccessorLookup(roleName: string, body: {
    secret_id_accessor?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-accessor/lookup`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function getAuthApproleRoleRoleNameSecretIdBoundCidrs(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-bound-cidrs`, {
        ...opts
    });
}
/**
 * Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function postAuthApproleRoleRoleNameSecretIdBoundCidrs(roleName: string, body: {
    secret_id_bound_cidrs?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-bound-cidrs`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Comma separated list of CIDR blocks, if set, specifies blocks of IP
 * addresses which can perform the login operation
 */
export async function deleteAuthApproleRoleRoleNameSecretIdBoundCidrs(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-bound-cidrs`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Use limit of the SecretID generated against the role.
 */
export async function getAuthApproleRoleRoleNameSecretIdNumUses(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-num-uses`, {
        ...opts
    });
}
/**
 * Use limit of the SecretID generated against the role.
 */
export async function postAuthApproleRoleRoleNameSecretIdNumUses(roleName: string, body: {
    secret_id_num_uses?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-num-uses`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Use limit of the SecretID generated against the role.
 */
export async function deleteAuthApproleRoleRoleNameSecretIdNumUses(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-num-uses`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Duration in seconds, representing the lifetime of the SecretIDs
 * that are generated against the role using 'role/<role_name>/secret-id' or
 * 'role/<role_name>/custom-secret-id' endpoints.
 */
export async function getAuthApproleRoleRoleNameSecretIdTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-ttl`, {
        ...opts
    });
}
/**
 * Duration in seconds, representing the lifetime of the SecretIDs
 * that are generated against the role using 'role/<role_name>/secret-id' or
 * 'role/<role_name>/custom-secret-id' endpoints.
 */
export async function postAuthApproleRoleRoleNameSecretIdTtl(roleName: string, body: {
    secret_id_ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-ttl`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Duration in seconds, representing the lifetime of the SecretIDs
 * that are generated against the role using 'role/<role_name>/secret-id' or
 * 'role/<role_name>/custom-secret-id' endpoints.
 */
export async function deleteAuthApproleRoleRoleNameSecretIdTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id-ttl`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Invalidate an issued secret_id
 */
export async function postAuthApproleRoleRoleNameSecretIdDestroy(roleName: string, body: {
    secret_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id/destroy`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Invalidate an issued secret_id
 */
export async function deleteAuthApproleRoleRoleNameSecretIdDestroy(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id/destroy`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the properties of an issued secret_id
 */
export async function postAuthApproleRoleRoleNameSecretIdLookup(roleName: string, body: {
    secret_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/secret-id/lookup`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Comma separated string or list of CIDR blocks. If set, specifies the blocks of
 * IP addresses which can use the returned token.
 */
export async function getAuthApproleRoleRoleNameTokenBoundCidrs(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-bound-cidrs`, {
        ...opts
    });
}
/**
 * Comma separated string or list of CIDR blocks. If set, specifies the blocks of
 * IP addresses which can use the returned token.
 */
export async function postAuthApproleRoleRoleNameTokenBoundCidrs(roleName: string, body: {
    token_bound_cidrs?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-bound-cidrs`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Comma separated string or list of CIDR blocks. If set, specifies the blocks of
 * IP addresses which can use the returned token.
 */
export async function deleteAuthApproleRoleRoleNameTokenBoundCidrs(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-bound-cidrs`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Duration in seconds, the maximum lifetime of the tokens issued by using
 * the SecretIDs that were generated against this role, after which the
 * tokens are not allowed to be renewed.
 */
export async function getAuthApproleRoleRoleNameTokenMaxTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-max-ttl`, {
        ...opts
    });
}
/**
 * Duration in seconds, the maximum lifetime of the tokens issued by using
 * the SecretIDs that were generated against this role, after which the
 * tokens are not allowed to be renewed.
 */
export async function postAuthApproleRoleRoleNameTokenMaxTtl(roleName: string, body: {
    token_max_ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-max-ttl`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Duration in seconds, the maximum lifetime of the tokens issued by using
 * the SecretIDs that were generated against this role, after which the
 * tokens are not allowed to be renewed.
 */
export async function deleteAuthApproleRoleRoleNameTokenMaxTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-max-ttl`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Number of times issued tokens can be used
 */
export async function getAuthApproleRoleRoleNameTokenNumUses(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-num-uses`, {
        ...opts
    });
}
/**
 * Number of times issued tokens can be used
 */
export async function postAuthApproleRoleRoleNameTokenNumUses(roleName: string, body: {
    token_num_uses?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-num-uses`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Number of times issued tokens can be used
 */
export async function deleteAuthApproleRoleRoleNameTokenNumUses(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-num-uses`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Duration in seconds, the lifetime of the token issued by using the SecretID that
 * is generated against this role, before which the token needs to be renewed.
 */
export async function getAuthApproleRoleRoleNameTokenTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-ttl`, {
        ...opts
    });
}
/**
 * Duration in seconds, the lifetime of the token issued by using the SecretID that
 * is generated against this role, before which the token needs to be renewed.
 */
export async function postAuthApproleRoleRoleNameTokenTtl(roleName: string, body: {
    token_ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-ttl`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Duration in seconds, the lifetime of the token issued by using the SecretID that
 * is generated against this role, before which the token needs to be renewed.
 */
export async function deleteAuthApproleRoleRoleNameTokenTtl(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/approle/role/${roleName}/token-ttl`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Trigger the clean-up of expired SecretID entries.
 */
export async function postAuthApproleTidySecretId(opts?: RequestOpts) {
    return await _.fetch("/auth/approle/tidy/secret-id", {
        ...opts,
        method: "POST"
    });
}
export async function getAuthAwsConfigCertificateCertName(certName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/certificate/${certName}`, {
        ...opts
    });
}
export async function postAuthAwsConfigCertificateCertName(certName: string, body: {
    aws_public_cert?: string;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/certificate/${certName}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsConfigCertificateCertName(certName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/certificate/${certName}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthAwsConfigCertificates({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/certificates${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsConfigClient(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/client", {
        ...opts
    });
}
export async function postAuthAwsConfigClient(body: {
    access_key?: string;
    endpoint?: string;
    iam_endpoint?: string;
    iam_server_id_header_value?: string;
    max_retries?: number;
    secret_key?: string;
    sts_endpoint?: string;
    sts_region?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/client", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsConfigClient(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/client", {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthAwsConfigIdentity(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/identity", {
        ...opts
    });
}
export async function postAuthAwsConfigIdentity(body: {
    ec2_alias?: string;
    ec2_metadata?: string[];
    iam_alias?: string;
    iam_metadata?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/identity", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthAwsConfigSts({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/sts${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsConfigStsAccountId(accountId: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/sts/${accountId}`, {
        ...opts
    });
}
export async function postAuthAwsConfigStsAccountId(accountId: string, body: {
    sts_role?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/sts/${accountId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsConfigStsAccountId(accountId: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/config/sts/${accountId}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthAwsConfigTidyIdentityWhitelist(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/identity-whitelist", {
        ...opts
    });
}
export async function postAuthAwsConfigTidyIdentityWhitelist(body: {
    disable_periodic_tidy?: boolean;
    safety_buffer?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/identity-whitelist", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsConfigTidyIdentityWhitelist(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/identity-whitelist", {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthAwsConfigTidyRoletagBlacklist(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/roletag-blacklist", {
        ...opts
    });
}
export async function postAuthAwsConfigTidyRoletagBlacklist(body: {
    disable_periodic_tidy?: boolean;
    safety_buffer?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/roletag-blacklist", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsConfigTidyRoletagBlacklist(opts?: RequestOpts) {
    return await _.fetch("/auth/aws/config/tidy/roletag-blacklist", {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthAwsIdentityWhitelist({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/identity-whitelist${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsIdentityWhitelistInstanceId(instanceId: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/identity-whitelist/${instanceId}`, {
        ...opts
    });
}
export async function deleteAuthAwsIdentityWhitelistInstanceId(instanceId: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/identity-whitelist/${instanceId}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthAwsLogin(body: {
    iam_http_request_method?: string;
    iam_request_body?: string;
    iam_request_headers?: string;
    iam_request_url?: string;
    identity?: string;
    nonce?: string;
    pkcs7?: string;
    role?: string;
    signature?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthAwsRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/role/${role}`, {
        ...opts
    });
}
export async function postAuthAwsRoleRole(role: string, body: {
    allow_instance_migration?: boolean;
    auth_type?: string;
    bound_account_id?: string[];
    bound_ami_id?: string[];
    bound_ec2_instance_id?: string[];
    bound_iam_instance_profile_arn?: string[];
    bound_iam_principal_arn?: string[];
    bound_iam_role_arn?: string[];
    bound_region?: string[];
    bound_subnet_id?: string[];
    bound_vpc_id?: string[];
    disallow_reauthentication?: boolean;
    inferred_aws_region?: string;
    inferred_entity_type?: string;
    max_ttl?: number;
    period?: number;
    policies?: string[];
    resolve_aws_unique_ids?: boolean;
    role_tag?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/role/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthAwsRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/role/${role}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthAwsRoleRoleTag(role: string, body: {
    allow_instance_migration?: boolean;
    disallow_reauthentication?: boolean;
    instance_id?: string;
    max_ttl?: number;
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/role/${role}/tag`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthAwsRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsRoletagBlacklist({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/roletag-blacklist${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthAwsRoletagBlacklistRoleTag(roleTag: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/roletag-blacklist/${roleTag}`, {
        ...opts
    });
}
export async function postAuthAwsRoletagBlacklistRoleTag(roleTag: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/roletag-blacklist/${roleTag}`, {
        ...opts,
        method: "POST"
    });
}
export async function deleteAuthAwsRoletagBlacklistRoleTag(roleTag: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/aws/roletag-blacklist/${roleTag}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthAwsTidyIdentityWhitelist(body: {
    safety_buffer?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/tidy/identity-whitelist", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function postAuthAwsTidyRoletagBlacklist(body: {
    safety_buffer?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/aws/tidy/roletag-blacklist", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configures the Azure authentication backend.
 */
export async function getAuthAzureConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/azure/config", {
        ...opts
    });
}
/**
 * Configures the Azure authentication backend.
 */
export async function postAuthAzureConfig(body: {
    client_id?: string;
    client_secret?: string;
    environment?: string;
    resource?: string;
    tenant_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/azure/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configures the Azure authentication backend.
 */
export async function deleteAuthAzureConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/azure/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Authenticates Azure Managed Service Identities with Vault.
 */
export async function postAuthAzureLogin(body: {
    jwt?: string;
    resource_group_name?: string;
    role?: string;
    subscription_id?: string;
    vm_name?: string;
    vmss_name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/azure/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles registered with the backend.
 */
export async function getAuthAzureRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/azure/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function getAuthAzureRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/azure/role/${name}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function postAuthAzureRoleName(name: string, body: {
    bound_group_ids?: string[];
    bound_locations?: string[];
    bound_resource_groups?: string[];
    bound_scale_sets?: string[];
    bound_service_principal_ids?: string[];
    bound_subscription_ids?: string[];
    max_ttl?: number;
    num_uses?: number;
    period?: number;
    policies?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/azure/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Register an role with the backend.
 */
export async function deleteAuthAzureRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/azure/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * This path allows you to configure the centrify auth provider to interact with the Centrify Identity Services Platform
 * for authenticating users.
 */
export async function getAuthCentrifyConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/centrify/config", {
        ...opts
    });
}
/**
 * This path allows you to configure the centrify auth provider to interact with the Centrify Identity Services Platform
 * for authenticating users.
 */
export async function postAuthCentrifyConfig(body: {
    app_id?: string;
    client_id?: string;
    client_secret?: string;
    policies?: string[];
    scope?: string;
    service_url?: string;
    token_bound_cidrs?: string[];
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/centrify/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Log in with a username and password.
 */
export async function postAuthCentrifyLogin(body: {
    mode?: string;
    password?: string;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/centrify/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage trusted certificates used for authentication.
 */
export async function getAuthCertCerts({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/certs${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage trusted certificates used for authentication.
 */
export async function getAuthCertCertsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/certs/${name}`, {
        ...opts
    });
}
/**
 * Manage trusted certificates used for authentication.
 */
export async function postAuthCertCertsName(name: string, body: {
    allowed_common_names?: string[];
    allowed_dns_sans?: string[];
    allowed_email_sans?: string[];
    allowed_names?: string[];
    allowed_organizational_units?: string[];
    allowed_uri_sans?: string[];
    bound_cidrs?: string[];
    certificate?: string;
    display_name?: string;
    lease?: number;
    max_ttl?: number;
    period?: number;
    policies?: string[];
    required_extensions?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/certs/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage trusted certificates used for authentication.
 */
export async function deleteAuthCertCertsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/certs/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthCertConfig(body: {
    disable_binding?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/cert/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage Certificate Revocation Lists checked during authentication.
 */
export async function getAuthCertCrlsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/crls/${name}`, {
        ...opts
    });
}
/**
 * Manage Certificate Revocation Lists checked during authentication.
 */
export async function postAuthCertCrlsName(name: string, body: {
    crl?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/crls/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage Certificate Revocation Lists checked during authentication.
 */
export async function deleteAuthCertCrlsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cert/crls/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthCertLogin(body: {
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/cert/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthCfConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/cf/config", {
        ...opts
    });
}
export async function postAuthCfConfig(body: {
    cf_api_addr?: string;
    cf_api_trusted_certificates?: string[];
    cf_password?: string;
    cf_username?: string;
    identity_ca_certificates?: string[];
    login_max_seconds_not_after?: number;
    login_max_seconds_not_before?: number;
    pcf_api_addr?: string;
    pcf_api_trusted_certificates?: string[];
    pcf_password?: string;
    pcf_username?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/cf/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthCfConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/cf/config", {
        ...opts,
        method: "DELETE"
    });
}
export async function postAuthCfLogin(body: {
    cf_instance_cert: string;
    role: string;
    signature: string;
    signing_time: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/cf/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthCfRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/cf/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthCfRolesRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cf/roles/${role}`, {
        ...opts
    });
}
export async function postAuthCfRolesRole(role: string, body: {
    bound_application_ids?: string[];
    bound_cidrs?: string[];
    bound_instance_ids?: string[];
    bound_organization_ids?: string[];
    bound_space_ids?: string[];
    disable_ip_matching?: boolean;
    max_ttl?: number;
    period?: number;
    policies?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/cf/roles/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthCfRolesRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/cf/roles/${role}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure credentials used to query the GCP IAM API to verify authenticating service accounts
 */
export async function getAuthGcpConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/gcp/config", {
        ...opts
    });
}
/**
 * Configure credentials used to query the GCP IAM API to verify authenticating service accounts
 */
export async function postAuthGcpConfig(body: {
    credentials?: string;
    gce_alias?: string;
    gce_metadata?: string[];
    google_certs_endpoint?: string;
    iam_alias?: string;
    iam_metadata?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/auth/gcp/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function postAuthGcpLogin(body: {
    jwt?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/gcp/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles that are registered with Vault.
 */
export async function getAuthGcpRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Create a GCP role with associated policies and required attributes.
 */
export async function getAuthGcpRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role/${name}`, {
        ...opts
    });
}
/**
 * Create a GCP role with associated policies and required attributes.
 */
export async function postAuthGcpRoleName(name: string, body: {
    add_group_aliases?: boolean;
    allow_gce_inference?: boolean;
    bound_instance_group?: string;
    bound_instance_groups?: string[];
    bound_labels?: string[];
    bound_projects?: string[];
    bound_region?: string;
    bound_regions?: string[];
    bound_service_accounts?: string[];
    bound_zone?: string;
    bound_zones?: string[];
    max_jwt_exp?: number;
    max_ttl?: number;
    period?: number;
    policies?: string[];
    project_id?: string;
    service_accounts?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Create a GCP role with associated policies and required attributes.
 */
export async function deleteAuthGcpRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add or remove labels for an existing 'gce' role
 */
export async function postAuthGcpRoleNameLabels(name: string, body: {
    add?: string[];
    remove?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role/${name}/labels`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Add or remove service accounts for an existing `iam` role
 */
export async function postAuthGcpRoleNameServiceAccounts(name: string, body: {
    add?: string[];
    remove?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/role/${name}/service-accounts`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles that are registered with Vault.
 */
export async function getAuthGcpRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/gcp/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthGithubConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/github/config", {
        ...opts
    });
}
export async function postAuthGithubConfig(body: {
    base_url?: string;
    max_ttl?: number;
    organization?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/github/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the access keys and host for Duo API connections.
 */
export async function postAuthGithubDuoAccess(body: {
    host?: string;
    ikey?: string;
    skey?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/github/duo/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure Duo second factor behavior.
 */
export async function getAuthGithubDuoConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/github/duo/config", {
        ...opts
    });
}
/**
 * Configure Duo second factor behavior.
 */
export async function postAuthGithubDuoConfig(body: {
    push_info?: string;
    user_agent?: string;
    username_format?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/github/duo/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function postAuthGithubLogin(body: {
    method?: string;
    passcode?: string;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/github/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read mappings for teams
 */
export async function getAuthGithubMapTeams({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/teams${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single teams mapping
 */
export async function getAuthGithubMapTeamsKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/teams/${key}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single teams mapping
 */
export async function postAuthGithubMapTeamsKey(key: string, body: {
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/teams/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read/write/delete a single teams mapping
 */
export async function deleteAuthGithubMapTeamsKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/teams/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read mappings for users
 */
export async function getAuthGithubMapUsers({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/users${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single users mapping
 */
export async function getAuthGithubMapUsersKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/users/${key}`, {
        ...opts
    });
}
/**
 * Read/write/delete a single users mapping
 */
export async function postAuthGithubMapUsersKey(key: string, body: {
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/users/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read/write/delete a single users mapping
 */
export async function deleteAuthGithubMapUsersKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/github/map/users/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure multi factor backend.
 */
export async function getAuthGithubMfaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/github/mfa_config", {
        ...opts
    });
}
/**
 * Configure multi factor backend.
 */
export async function postAuthGithubMfaConfig(body: {
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/github/mfa_config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read the current JWT authentication backend configuration.
 */
export async function getAuthJwtConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/config", {
        ...opts
    });
}
/**
 * Configure the JWT authentication backend.
 */
export async function postAuthJwtConfig(body: {
    bound_issuer?: string;
    default_role?: string;
    jwks_ca_pem?: string;
    jwks_url?: string;
    jwt_supported_algs?: string[];
    jwt_validation_pubkeys?: string[];
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_discovery_ca_pem?: string;
    oidc_discovery_url?: string;
    oidc_response_mode?: string;
    oidc_response_types?: string[];
    provider_config?: object;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Authenticates to Vault using a JWT (or OIDC) token.
 */
export async function postAuthJwtLogin(body: {
    jwt?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request an authorization URL to start an OIDC login flow.
 */
export async function postAuthJwtOidcAuthUrl(body: {
    client_nonce?: string;
    redirect_uri?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/oidc/auth_url", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Callback endpoint to complete an OIDC login.
 */
export async function getAuthJwtOidcCallback(opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/oidc/callback", {
        ...opts
    });
}
/**
 * Callback endpoint to handle form_posts.
 */
export async function postAuthJwtOidcCallback(body: {
    client_nonce?: string;
    code?: string;
    id_token?: string;
    state?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/jwt/oidc/callback", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles registered with the backend.
 */
export async function getAuthJwtRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/jwt/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read an existing role.
 */
export async function getAuthJwtRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/jwt/role/${name}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function postAuthJwtRoleName(name: string, body: {
    allowed_redirect_uris?: string[];
    bound_audiences?: string[];
    bound_cidrs?: string[];
    bound_claims?: object;
    bound_claims_type?: string;
    bound_subject?: string;
    claim_mappings?: object;
    clock_skew_leeway?: number;
    expiration_leeway?: number;
    groups_claim?: string;
    max_ttl?: number;
    not_before_leeway?: number;
    num_uses?: number;
    oidc_scopes?: string[];
    period?: number;
    policies?: string[];
    role_type?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
    user_claim?: string;
    verbose_oidc_logging?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/jwt/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete an existing role.
 */
export async function deleteAuthJwtRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/jwt/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthKerberosConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/config", {
        ...opts
    });
}
export async function postAuthKerberosConfig(body: {
    keytab?: string;
    service_account?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthKerberosConfigLdap(opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/config/ldap", {
        ...opts
    });
}
export async function postAuthKerberosConfigLdap(body: {
    anonymous_group_search?: boolean;
    binddn?: string;
    bindpass?: string;
    case_sensitive_names?: boolean;
    certificate?: string;
    client_tls_cert?: string;
    client_tls_key?: string;
    deny_null_bind?: boolean;
    discoverdn?: boolean;
    groupattr?: string;
    groupdn?: string;
    groupfilter?: string;
    insecure_tls?: boolean;
    request_timeout?: number;
    starttls?: boolean;
    tls_max_version?: "tls10" | "tls11" | "tls12" | "tls13";
    tls_min_version?: "tls10" | "tls11" | "tls12" | "tls13";
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    upndomain?: string;
    url?: string;
    use_pre111_group_cn_behavior?: boolean;
    use_token_groups?: boolean;
    userattr?: string;
    userdn?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/config/ldap", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getAuthKerberosGroups({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/kerberos/groups${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthKerberosGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/kerberos/groups/${name}`, {
        ...opts
    });
}
export async function postAuthKerberosGroupsName(name: string, body: {
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/kerberos/groups/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthKerberosGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/kerberos/groups/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getAuthKerberosLogin(opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/login", {
        ...opts
    });
}
export async function postAuthKerberosLogin(body: {
    authorization?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/kerberos/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configures the JWT Public Key and Kubernetes API information.
 */
export async function getAuthKubernetesConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/kubernetes/config", {
        ...opts
    });
}
/**
 * Configures the JWT Public Key and Kubernetes API information.
 */
export async function postAuthKubernetesConfig(body: {
    disable_iss_validation?: boolean;
    issuer?: string;
    kubernetes_ca_cert?: string;
    kubernetes_host?: string;
    pem_keys?: string[];
    token_reviewer_jwt?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/kubernetes/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Authenticates Kubernetes service accounts with Vault.
 */
export async function postAuthKubernetesLogin(body: {
    jwt?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/kubernetes/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles registered with the backend.
 */
export async function getAuthKubernetesRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/kubernetes/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function getAuthKubernetesRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/kubernetes/role/${name}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function postAuthKubernetesRoleName(name: string, body: {
    audience?: string;
    bound_cidrs?: string[];
    bound_service_account_names?: string[];
    bound_service_account_namespaces?: string[];
    max_ttl?: number;
    num_uses?: number;
    period?: number;
    policies?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/kubernetes/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Register an role with the backend.
 */
export async function deleteAuthKubernetesRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/kubernetes/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the LDAP server to connect to, along with its options.
 */
export async function getAuthLdapConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/config", {
        ...opts
    });
}
/**
 * Configure the LDAP server to connect to, along with its options.
 */
export async function postAuthLdapConfig(body: {
    anonymous_group_search?: boolean;
    binddn?: string;
    bindpass?: string;
    case_sensitive_names?: boolean;
    certificate?: string;
    client_tls_cert?: string;
    client_tls_key?: string;
    deny_null_bind?: boolean;
    discoverdn?: boolean;
    groupattr?: string;
    groupdn?: string;
    groupfilter?: string;
    insecure_tls?: boolean;
    request_timeout?: number;
    starttls?: boolean;
    tls_max_version?: "tls10" | "tls11" | "tls12" | "tls13";
    tls_min_version?: "tls10" | "tls11" | "tls12" | "tls13";
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    upndomain?: string;
    url?: string;
    use_pre111_group_cn_behavior?: boolean;
    use_token_groups?: boolean;
    userattr?: string;
    userdn?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the access keys and host for Duo API connections.
 */
export async function postAuthLdapDuoAccess(body: {
    host?: string;
    ikey?: string;
    skey?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/duo/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure Duo second factor behavior.
 */
export async function getAuthLdapDuoConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/duo/config", {
        ...opts
    });
}
/**
 * Configure Duo second factor behavior.
 */
export async function postAuthLdapDuoConfig(body: {
    push_info?: string;
    user_agent?: string;
    username_format?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/duo/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function getAuthLdapGroups({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/groups${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function getAuthLdapGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/groups/${name}`, {
        ...opts
    });
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function postAuthLdapGroupsName(name: string, body: {
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/groups/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function deleteAuthLdapGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/groups/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Log in with a username and password.
 */
export async function postAuthLdapLoginUsername(username: string, body: {
    method?: string;
    passcode?: string;
    password?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/login/${username}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure multi factor backend.
 */
export async function getAuthLdapMfaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/mfa_config", {
        ...opts
    });
}
/**
 * Configure multi factor backend.
 */
export async function postAuthLdapMfaConfig(body: {
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/ldap/mfa_config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthLdapUsers({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/users${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthLdapUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/users/${name}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function postAuthLdapUsersName(name: string, body: {
    groups?: string[];
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/users/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function deleteAuthLdapUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/ldap/users/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Manages the configuration for the Vault Auth Plugin.
 */
export async function getAuthOciConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/oci/config", {
        ...opts
    });
}
/**
 * Manages the configuration for the Vault Auth Plugin.
 */
export async function postAuthOciConfig(body: {
    home_tenancy_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/oci/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manages the configuration for the Vault Auth Plugin.
 */
export async function deleteAuthOciConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/oci/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Authenticates to Vault using OCI credentials
 */
export async function postAuthOciLoginRole(role: string, body: {
    request_headers?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/oci/login/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles that are registered with Vault.
 */
export async function getAuthOciRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/oci/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Create a role and associate policies to it.
 */
export async function getAuthOciRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/oci/role/${role}`, {
        ...opts
    });
}
/**
 * Create a role and associate policies to it.
 */
export async function postAuthOciRoleRole(role: string, body: {
    ocid_list?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/oci/role/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Create a role and associate policies to it.
 */
export async function deleteAuthOciRoleRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/oci/role/${role}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the current JWT authentication backend configuration.
 */
export async function getAuthOidcConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/config", {
        ...opts
    });
}
/**
 * Configure the JWT authentication backend.
 */
export async function postAuthOidcConfig(body: {
    bound_issuer?: string;
    default_role?: string;
    jwks_ca_pem?: string;
    jwks_url?: string;
    jwt_supported_algs?: string[];
    jwt_validation_pubkeys?: string[];
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_discovery_ca_pem?: string;
    oidc_discovery_url?: string;
    oidc_response_mode?: string;
    oidc_response_types?: string[];
    provider_config?: object;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Authenticates to Vault using a JWT (or OIDC) token.
 */
export async function postAuthOidcLogin(body: {
    jwt?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request an authorization URL to start an OIDC login flow.
 */
export async function postAuthOidcOidcAuthUrl(body: {
    client_nonce?: string;
    redirect_uri?: string;
    role?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/oidc/auth_url", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Callback endpoint to complete an OIDC login.
 */
export async function getAuthOidcOidcCallback(opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/oidc/callback", {
        ...opts
    });
}
/**
 * Callback endpoint to handle form_posts.
 */
export async function postAuthOidcOidcCallback(body: {
    client_nonce?: string;
    code?: string;
    id_token?: string;
    state?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/oidc/oidc/callback", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the roles registered with the backend.
 */
export async function getAuthOidcRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/oidc/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read an existing role.
 */
export async function getAuthOidcRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/oidc/role/${name}`, {
        ...opts
    });
}
/**
 * Register an role with the backend.
 */
export async function postAuthOidcRoleName(name: string, body: {
    allowed_redirect_uris?: string[];
    bound_audiences?: string[];
    bound_cidrs?: string[];
    bound_claims?: object;
    bound_claims_type?: string;
    bound_subject?: string;
    claim_mappings?: object;
    clock_skew_leeway?: number;
    expiration_leeway?: number;
    groups_claim?: string;
    max_ttl?: number;
    not_before_leeway?: number;
    num_uses?: number;
    oidc_scopes?: string[];
    period?: number;
    policies?: string[];
    role_type?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
    user_claim?: string;
    verbose_oidc_logging?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/oidc/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete an existing role.
 */
export async function deleteAuthOidcRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/oidc/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * This endpoint allows you to configure the Okta and its
 * configuration options.
 *
 * The Okta organization are the characters at the front of the URL for Okta.
 * Example https://ORG.okta.com
 */
export async function getAuthOktaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/okta/config", {
        ...opts
    });
}
/**
 * This endpoint allows you to configure the Okta and its
 * configuration options.
 *
 * The Okta organization are the characters at the front of the URL for Okta.
 * Example https://ORG.okta.com
 */
export async function postAuthOktaConfig(body: {
    api_token?: string;
    base_url?: string;
    bypass_okta_mfa?: boolean;
    max_ttl?: number;
    org_name?: string;
    organization?: string;
    production?: boolean;
    token?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/okta/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the access keys and host for Duo API connections.
 */
export async function postAuthOktaDuoAccess(body: {
    host?: string;
    ikey?: string;
    skey?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/okta/duo/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure Duo second factor behavior.
 */
export async function getAuthOktaDuoConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/okta/duo/config", {
        ...opts
    });
}
/**
 * Configure Duo second factor behavior.
 */
export async function postAuthOktaDuoConfig(body: {
    push_info?: string;
    user_agent?: string;
    username_format?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/okta/duo/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthOktaGroups({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/groups${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthOktaGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/groups/${name}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function postAuthOktaGroupsName(name: string, body: {
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/groups/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function deleteAuthOktaGroupsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/groups/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Log in with a username and password.
 */
export async function postAuthOktaLoginUsername(username: string, body: {
    method?: string;
    passcode?: string;
    password?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/login/${username}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure multi factor backend.
 */
export async function getAuthOktaMfaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/okta/mfa_config", {
        ...opts
    });
}
/**
 * Configure multi factor backend.
 */
export async function postAuthOktaMfaConfig(body: {
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/okta/mfa_config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function getAuthOktaUsers({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/users${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function getAuthOktaUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/users/${name}`, {
        ...opts
    });
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function postAuthOktaUsersName(name: string, body: {
    groups?: string[];
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/users/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage additional groups for users allowed to authenticate.
 */
export async function deleteAuthOktaUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/okta/users/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the RADIUS server to connect to, along with its options.
 */
export async function getAuthRadiusConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/radius/config", {
        ...opts
    });
}
/**
 * Configure the RADIUS server to connect to, along with its options.
 */
export async function postAuthRadiusConfig(body: {
    dial_timeout?: number;
    host?: string;
    nas_identifier?: string;
    nas_port?: number;
    port?: number;
    read_timeout?: number;
    secret?: string;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    unregistered_user_policies?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/radius/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the access keys and host for Duo API connections.
 */
export async function postAuthRadiusDuoAccess(body: {
    host?: string;
    ikey?: string;
    skey?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/radius/duo/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure Duo second factor behavior.
 */
export async function getAuthRadiusDuoConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/radius/duo/config", {
        ...opts
    });
}
/**
 * Configure Duo second factor behavior.
 */
export async function postAuthRadiusDuoConfig(body: {
    push_info?: string;
    user_agent?: string;
    username_format?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/radius/duo/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Log in with a username and password.
 */
export async function postAuthRadiusLogin(body: {
    method?: string;
    passcode?: string;
    password?: string;
    urlusername?: string;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/radius/login", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Log in with a username and password.
 */
export async function postAuthRadiusLoginUrlusername(urlusername: string, body: {
    method?: string;
    passcode?: string;
    password?: string;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/radius/login/${urlusername}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure multi factor backend.
 */
export async function getAuthRadiusMfaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/radius/mfa_config", {
        ...opts
    });
}
/**
 * Configure multi factor backend.
 */
export async function postAuthRadiusMfaConfig(body: {
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/radius/mfa_config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthRadiusUsers({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/radius/users${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthRadiusUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/radius/users/${name}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function postAuthRadiusUsersName(name: string, body: {
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/radius/users/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function deleteAuthRadiusUsersName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/radius/users/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * List token accessors, which can then be
 * be used to iterate and discover their properties
 * or revoke them. Because this can be used to
 * cause a denial of service, this endpoint
 * requires 'sudo' capability in addition to
 * 'list'.
 */
export async function getAuthTokenAccessors({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/accessors/${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * The token create path is used to create new tokens.
 */
export async function postAuthTokenCreate(opts?: RequestOpts) {
    return await _.fetch("/auth/token/create", {
        ...opts,
        method: "POST"
    });
}
/**
 * The token create path is used to create new orphan tokens.
 */
export async function postAuthTokenCreateOrphan(opts?: RequestOpts) {
    return await _.fetch("/auth/token/create-orphan", {
        ...opts,
        method: "POST"
    });
}
/**
 * This token create path is used to create new tokens adhering to the given role.
 */
export async function postAuthTokenCreateRoleName(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/create/${roleName}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * This endpoint will lookup a token and its properties.
 */
export async function getAuthTokenLookup(opts?: RequestOpts) {
    return await _.fetch("/auth/token/lookup", {
        ...opts
    });
}
/**
 * This endpoint will lookup a token and its properties.
 */
export async function postAuthTokenLookup(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/lookup", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will lookup a token associated with the given accessor and its properties. Response will not contain the token ID.
 */
export async function postAuthTokenLookupAccessor(body: {
    accessor?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/lookup-accessor", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will lookup a token and its properties.
 */
export async function getAuthTokenLookupSelf(opts?: RequestOpts) {
    return await _.fetch("/auth/token/lookup-self", {
        ...opts
    });
}
/**
 * This endpoint will lookup a token and its properties.
 */
export async function postAuthTokenLookupSelf(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/lookup-self", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will renew the given token and prevent expiration.
 */
export async function postAuthTokenRenew(body: {
    increment?: number;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/renew", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will renew a token associated with the given accessor and its properties. Response will not contain the token ID.
 */
export async function postAuthTokenRenewAccessor(body: {
    accessor?: string;
    increment?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/renew-accessor", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will renew the token used to call it and prevent expiration.
 */
export async function postAuthTokenRenewSelf(body: {
    increment?: number;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/renew-self", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will delete the given token and all of its child tokens.
 */
export async function postAuthTokenRevoke(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/revoke", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will delete the token associated with the accessor and all of its child tokens.
 */
export async function postAuthTokenRevokeAccessor(body: {
    accessor?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/revoke-accessor", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will delete the token and orphan its child tokens.
 */
export async function postAuthTokenRevokeOrphan(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/token/revoke-orphan", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint will delete the token used to call it and all of its child tokens.
 */
export async function postAuthTokenRevokeSelf(opts?: RequestOpts) {
    return await _.fetch("/auth/token/revoke-self", {
        ...opts,
        method: "POST"
    });
}
/**
 * This endpoint lists configured roles.
 */
export async function getAuthTokenRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getAuthTokenRolesRoleName(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/roles/${roleName}`, {
        ...opts
    });
}
export async function postAuthTokenRolesRoleName(roleName: string, body: {
    allowed_entity_aliases?: string[];
    allowed_policies?: string[];
    bound_cidrs?: string[];
    disallowed_policies?: string[];
    explicit_max_ttl?: number;
    orphan?: boolean;
    path_suffix?: string;
    period?: number;
    renewable?: boolean;
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/roles/${roleName}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteAuthTokenRolesRoleName(roleName: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/token/roles/${roleName}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * This endpoint performs cleanup tasks that can be run if certain error
 * conditions have occurred.
 */
export async function postAuthTokenTidy(opts?: RequestOpts) {
    return await _.fetch("/auth/token/tidy", {
        ...opts,
        method: "POST"
    });
}
/**
 * Configure the access keys and host for Duo API connections.
 */
export async function postAuthUserpassDuoAccess(body: {
    host?: string;
    ikey?: string;
    skey?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/userpass/duo/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure Duo second factor behavior.
 */
export async function getAuthUserpassDuoConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/userpass/duo/config", {
        ...opts
    });
}
/**
 * Configure Duo second factor behavior.
 */
export async function postAuthUserpassDuoConfig(body: {
    push_info?: string;
    user_agent?: string;
    username_format?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/userpass/duo/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Log in with a username and password.
 */
export async function postAuthUserpassLoginUsername(username: string, body: {
    method?: string;
    passcode?: string;
    password?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/login/${username}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure multi factor backend.
 */
export async function getAuthUserpassMfaConfig(opts?: RequestOpts) {
    return await _.fetch("/auth/userpass/mfa_config", {
        ...opts
    });
}
/**
 * Configure multi factor backend.
 */
export async function postAuthUserpassMfaConfig(body: {
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/auth/userpass/mfa_config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthUserpassUsers({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function getAuthUserpassUsersUsername(username: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users/${username}`, {
        ...opts
    });
}
/**
 * Manage users allowed to authenticate.
 */
export async function postAuthUserpassUsersUsername(username: string, body: {
    bound_cidrs?: string[];
    max_ttl?: number;
    password?: string;
    policies?: string[];
    token_bound_cidrs?: string[];
    token_explicit_max_ttl?: number;
    token_max_ttl?: number;
    token_no_default_policy?: boolean;
    token_num_uses?: number;
    token_period?: number;
    token_policies?: string[];
    token_ttl?: number;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users/${username}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage users allowed to authenticate.
 */
export async function deleteAuthUserpassUsersUsername(username: string, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users/${username}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Reset user's password.
 */
export async function postAuthUserpassUsersUsernamePassword(username: string, body: {
    password?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users/${username}/password`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update the policies associated with the username.
 */
export async function postAuthUserpassUsersUsernamePolicies(username: string, body: {
    policies?: string[];
    token_policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/auth/userpass/users/${username}/policies`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function getAwsConfigLease(opts?: RequestOpts) {
    return await _.fetch("/aws/config/lease", {
        ...opts
    });
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function postAwsConfigLease(body: {
    lease?: string;
    lease_max?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/aws/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the root credentials that are used to manage IAM.
 */
export async function getAwsConfigRoot(opts?: RequestOpts) {
    return await _.fetch("/aws/config/root", {
        ...opts
    });
}
/**
 * Configure the root credentials that are used to manage IAM.
 */
export async function postAwsConfigRoot(body: {
    access_key?: string;
    iam_endpoint?: string;
    max_retries?: number;
    region?: string;
    secret_key?: string;
    sts_endpoint?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/aws/config/root", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request to rotate the AWS credentials used by Vault
 */
export async function postAwsConfigRotateRoot(opts?: RequestOpts) {
    return await _.fetch("/aws/config/rotate-root", {
        ...opts,
        method: "POST"
    });
}
/**
 * Generate AWS credentials from a specific Vault role.
 */
export async function getAwsCreds(opts?: RequestOpts) {
    return await _.fetch("/aws/creds", {
        ...opts
    });
}
/**
 * Generate AWS credentials from a specific Vault role.
 */
export async function postAwsCreds(body: {
    name?: string;
    role_arn?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/aws/creds", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List the existing roles in this backend
 */
export async function getAwsRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/aws/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Read, write and reference IAM policies that access keys can be made for.
 */
export async function getAwsRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/aws/roles/${name}`, {
        ...opts
    });
}
/**
 * Read, write and reference IAM policies that access keys can be made for.
 */
export async function postAwsRolesName(name: string, body: {
    arn?: string;
    credential_type?: string;
    default_sts_ttl?: number;
    iam_groups?: string[];
    max_sts_ttl?: number;
    permissions_boundary_arn?: string;
    policy?: string;
    policy_arns?: string[];
    policy_document?: string;
    role_arns?: string[];
    user_path?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/aws/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read, write and reference IAM policies that access keys can be made for.
 */
export async function deleteAwsRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/aws/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Generate AWS credentials from a specific Vault role.
 */
export async function getAwsStsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/aws/sts/${name}`, {
        ...opts
    });
}
/**
 * Generate AWS credentials from a specific Vault role.
 */
export async function postAwsStsName(name: string, body: {
    role_arn?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/aws/sts/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the Azure Secret backend.
 */
export async function getAzureConfig(opts?: RequestOpts) {
    return await _.fetch("/azure/config", {
        ...opts
    });
}
/**
 * Configure the Azure Secret backend.
 */
export async function postAzureConfig(body: {
    client_id?: string;
    client_secret?: string;
    environment?: string;
    password_policy?: string;
    subscription_id?: string;
    tenant_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/azure/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the Azure Secret backend.
 */
export async function deleteAzureConfig(opts?: RequestOpts) {
    return await _.fetch("/azure/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Request Service Principal credentials for a given Vault role.
 */
export async function getAzureCredsRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/azure/creds/${role}`, {
        ...opts
    });
}
/**
 * List existing roles.
 */
export async function getAzureRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/azure/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the Vault roles used to generate Azure credentials.
 */
export async function getAzureRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/azure/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the Vault roles used to generate Azure credentials.
 */
export async function postAzureRolesName(name: string, body: {
    application_object_id?: string;
    azure_groups?: string;
    azure_roles?: string;
    max_ttl?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/azure/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the Vault roles used to generate Azure credentials.
 */
export async function deleteAzureRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/azure/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the connection information to talk to Cassandra.
 */
export async function getCassandraConfigConnection(opts?: RequestOpts) {
    return await _.fetch("/cassandra/config/connection", {
        ...opts
    });
}
/**
 * Configure the connection information to talk to Cassandra.
 */
export async function postCassandraConfigConnection(body: {
    connect_timeout?: number;
    hosts?: string;
    insecure_tls?: boolean;
    password?: string;
    pem_bundle?: string;
    pem_json?: string;
    protocol_version?: number;
    tls?: boolean;
    tls_min_version?: string;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/cassandra/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request database credentials for a certain role.
 */
export async function getCassandraCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/cassandra/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getCassandraRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/cassandra/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postCassandraRolesName(name: string, body: {
    consistency?: string;
    creation_cql?: string;
    lease?: string;
    rollback_cql?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/cassandra/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deleteCassandraRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/cassandra/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getConsulConfigAccess(opts?: RequestOpts) {
    return await _.fetch("/consul/config/access", {
        ...opts
    });
}
export async function postConsulConfigAccess(body: {
    address?: string;
    ca_cert?: string;
    client_cert?: string;
    client_key?: string;
    scheme?: string;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/consul/config/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getConsulCredsRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/consul/creds/${role}`, {
        ...opts
    });
}
export async function getConsulRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/consul/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getConsulRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/consul/roles/${name}`, {
        ...opts
    });
}
export async function postConsulRolesName(name: string, body: {
    lease?: number;
    local?: boolean;
    max_ttl?: number;
    policies?: string[];
    policy?: string;
    token_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/consul/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteConsulRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/consul/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Retrieve the secret at the specified location.
 */
export async function getCubbyholePath(path: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/cubbyhole/${path}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Store a secret at the specified location.
 */
export async function postCubbyholePath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/cubbyhole/${path}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Deletes the secret at the specified location.
 */
export async function deleteCubbyholePath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/cubbyhole/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure connection details to a database plugin.
 */
export async function getDatabaseConfig({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/database/config${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Configure connection details to a database plugin.
 */
export async function getDatabaseConfigName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/config/${name}`, {
        ...opts
    });
}
/**
 * Configure connection details to a database plugin.
 */
export async function postDatabaseConfigName(name: string, body: {
    allowed_roles?: string[];
    plugin_name?: string;
    root_rotation_statements?: string[];
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/database/config/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure connection details to a database plugin.
 */
export async function deleteDatabaseConfigName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/config/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Request database credentials for a certain role.
 */
export async function getDatabaseCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/creds/${name}`, {
        ...opts
    });
}
/**
 * Resets a database plugin.
 */
export async function postDatabaseResetName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/reset/${name}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getDatabaseRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/database/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getDatabaseRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postDatabaseRolesName(name: string, body: {
    creation_statements?: string[];
    db_name?: string;
    default_ttl?: number;
    max_ttl?: number;
    renew_statements?: string[];
    revocation_statements?: string[];
    rollback_statements?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/database/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deleteDatabaseRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postDatabaseRotateRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/rotate-role/${name}`, {
        ...opts,
        method: "POST"
    });
}
export async function postDatabaseRotateRootName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/rotate-root/${name}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Request database credentials for a certain static role. These credentials are
 * rotated periodically.
 */
export async function getDatabaseStaticCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/static-creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the static roles that can be created with this backend.
 */
export async function getDatabaseStaticRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/database/static-roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the static roles that can be created with this backend.
 */
export async function getDatabaseStaticRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/static-roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the static roles that can be created with this backend.
 */
export async function postDatabaseStaticRolesName(name: string, body: {
    db_name?: string;
    rotation_period?: number;
    rotation_statements?: string[];
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/database/static-roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the static roles that can be created with this backend.
 */
export async function deleteDatabaseStaticRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/database/static-roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getGcpConfig(opts?: RequestOpts) {
    return await _.fetch("/gcp/config", {
        ...opts
    });
}
export async function postGcpConfig(body: {
    credentials?: string;
    max_ttl?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/gcp/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function postGcpConfigRotateRoot(opts?: RequestOpts) {
    return await _.fetch("/gcp/config/rotate-root", {
        ...opts,
        method: "POST"
    });
}
export async function getGcpKeyRoleset(roleset: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/key/${roleset}`, {
        ...opts
    });
}
export async function postGcpKeyRoleset(roleset: string, body: {
    key_algorithm?: string;
    key_type?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcp/key/${roleset}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getGcpRolesetName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/roleset/${name}`, {
        ...opts
    });
}
export async function postGcpRolesetName(name: string, body: {
    bindings?: string;
    project?: string;
    secret_type?: string;
    token_scopes?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/gcp/roleset/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteGcpRolesetName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/roleset/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function postGcpRolesetNameRotate(name: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/roleset/${name}/rotate`, {
        ...opts,
        method: "POST"
    });
}
export async function postGcpRolesetNameRotateKey(name: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/roleset/${name}/rotate-key`, {
        ...opts,
        method: "POST"
    });
}
export async function getGcpRolesets({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/gcp/rolesets${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getGcpTokenRoleset(roleset: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/token/${roleset}`, {
        ...opts
    });
}
export async function postGcpTokenRoleset(roleset: string, opts?: RequestOpts) {
    return await _.fetch(`/gcp/token/${roleset}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Configure the GCP KMS secrets engine
 */
export async function getGcpkmsConfig(opts?: RequestOpts) {
    return await _.fetch("/gcpkms/config", {
        ...opts
    });
}
/**
 * Configure the GCP KMS secrets engine
 */
export async function postGcpkmsConfig(body: {
    credentials?: string;
    scopes?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/gcpkms/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the GCP KMS secrets engine
 */
export async function deleteGcpkmsConfig(opts?: RequestOpts) {
    return await _.fetch("/gcpkms/config", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Decrypt a ciphertext value using a named key
 */
export async function postGcpkmsDecryptKey(key: string, body: {
    additional_authenticated_data?: string;
    ciphertext?: string;
    key_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/decrypt/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Encrypt a plaintext value using a named key
 */
export async function postGcpkmsEncryptKey(key: string, body: {
    additional_authenticated_data?: string;
    key_version?: number;
    plaintext?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/encrypt/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List named keys
 */
export async function getGcpkmsKeys({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Configure the key in Vault
 */
export async function getGcpkmsKeysConfigKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/config/${key}`, {
        ...opts
    });
}
/**
 * Configure the key in Vault
 */
export async function postGcpkmsKeysConfigKey(key: string, body: {
    max_version?: number;
    min_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/config/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Deregister an existing key in Vault
 */
export async function postGcpkmsKeysDeregisterKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/deregister/${key}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Deregister an existing key in Vault
 */
export async function deleteGcpkmsKeysDeregisterKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/deregister/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Register an existing crypto key in Google Cloud KMS
 */
export async function postGcpkmsKeysRegisterKey(key: string, body: {
    crypto_key?: string;
    verify?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/register/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Rotate a crypto key to a new primary version
 */
export async function postGcpkmsKeysRotateKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/rotate/${key}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete old crypto key versions from Google Cloud KMS
 */
export async function postGcpkmsKeysTrimKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/trim/${key}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete old crypto key versions from Google Cloud KMS
 */
export async function deleteGcpkmsKeysTrimKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/trim/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Interact with crypto keys in Vault and Google Cloud KMS
 */
export async function getGcpkmsKeysKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/${key}`, {
        ...opts
    });
}
/**
 * Interact with crypto keys in Vault and Google Cloud KMS
 */
export async function postGcpkmsKeysKey(key: string, body: {
    algorithm?: string;
    crypto_key?: string;
    key_ring?: string;
    labels?: object;
    protection_level?: string;
    purpose?: string;
    rotation_period?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Interact with crypto keys in Vault and Google Cloud KMS
 */
export async function deleteGcpkmsKeysKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/keys/${key}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Retrieve the public key associated with the named key
 */
export async function getGcpkmsPubkeyKey(key: string, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/pubkey/${key}`, {
        ...opts
    });
}
/**
 * Re-encrypt existing ciphertext data to a new version
 */
export async function postGcpkmsReencryptKey(key: string, body: {
    additional_authenticated_data?: string;
    ciphertext?: string;
    key_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/reencrypt/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Signs a message or digest using a named key
 */
export async function postGcpkmsSignKey(key: string, body: {
    digest?: string;
    key_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/sign/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Verify a signature using a named key
 */
export async function postGcpkmsVerifyKey(key: string, body: {
    digest?: string;
    key_version?: number;
    signature?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/gcpkms/verify/${key}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Create a new alias.
 */
export async function postIdentityAlias(body: {
    canonical_id?: string;
    entity_id?: string;
    id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/alias", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the alias IDs.
 */
export async function getIdentityAliasId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/alias/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function getIdentityAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/alias/id/${id}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function postIdentityAliasIdId(id: string, body: {
    canonical_id?: string;
    entity_id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/alias/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update, read or delete an alias ID.
 */
export async function deleteIdentityAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/alias/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Create a new entity
 */
export async function postIdentityEntity(body: {
    disabled?: boolean;
    id?: string;
    metadata?: object;
    name?: string;
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/identity/entity", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Create a new alias.
 */
export async function postIdentityEntityAlias(body: {
    canonical_id?: string;
    entity_id?: string;
    id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/entity-alias", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the alias IDs.
 */
export async function getIdentityEntityAliasId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity-alias/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function getIdentityEntityAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity-alias/id/${id}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function postIdentityEntityAliasIdId(id: string, body: {
    canonical_id?: string;
    entity_id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity-alias/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update, read or delete an alias ID.
 */
export async function deleteIdentityEntityAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity-alias/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Delete all of the entities provided
 */
export async function postIdentityEntityBatchDelete(body: {
    entity_ids?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/identity/entity/batch-delete", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the entity IDs
 */
export async function getIdentityEntityId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update, read or delete an entity using entity ID
 */
export async function getIdentityEntityIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/id/${id}`, {
        ...opts
    });
}
/**
 * Update, read or delete an entity using entity ID
 */
export async function postIdentityEntityIdId(id: string, body: {
    disabled?: boolean;
    metadata?: object;
    name?: string;
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update, read or delete an entity using entity ID
 */
export async function deleteIdentityEntityIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Merge two or more entities together
 */
export async function postIdentityEntityMerge(body: {
    force?: boolean;
    from_entity_ids?: string[];
    to_entity_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/entity/merge", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the entity names
 */
export async function getIdentityEntityName({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/name${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update, read or delete an entity using entity name
 */
export async function getIdentityEntityNameName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/name/${name}`, {
        ...opts
    });
}
/**
 * Update, read or delete an entity using entity name
 */
export async function postIdentityEntityNameName(name: string, body: {
    disabled?: boolean;
    id?: string;
    metadata?: object;
    policies?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/name/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update, read or delete an entity using entity name
 */
export async function deleteIdentityEntityNameName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/entity/name/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Create a new group.
 */
export async function postIdentityGroup(body: {
    id?: string;
    member_entity_ids?: string[];
    member_group_ids?: string[];
    metadata?: object;
    name?: string;
    policies?: string[];
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/group", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Creates a new group alias, or updates an existing one.
 */
export async function postIdentityGroupAlias(body: {
    canonical_id?: string;
    id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/group-alias", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the group alias IDs.
 */
export async function getIdentityGroupAliasId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group-alias/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getIdentityGroupAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group-alias/id/${id}`, {
        ...opts
    });
}
export async function postIdentityGroupAliasIdId(id: string, body: {
    canonical_id?: string;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group-alias/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteIdentityGroupAliasIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group-alias/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * List all the group IDs.
 */
export async function getIdentityGroupId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update or delete an existing group using its ID.
 */
export async function getIdentityGroupIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/id/${id}`, {
        ...opts
    });
}
/**
 * Update or delete an existing group using its ID.
 */
export async function postIdentityGroupIdId(id: string, body: {
    member_entity_ids?: string[];
    member_group_ids?: string[];
    metadata?: object;
    name?: string;
    policies?: string[];
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update or delete an existing group using its ID.
 */
export async function deleteIdentityGroupIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getIdentityGroupName({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/name${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getIdentityGroupNameName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/name/${name}`, {
        ...opts
    });
}
export async function postIdentityGroupNameName(name: string, body: {
    id?: string;
    member_entity_ids?: string[];
    member_group_ids?: string[];
    metadata?: object;
    policies?: string[];
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/name/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteIdentityGroupNameName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/group/name/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Query entities based on various properties.
 */
export async function postIdentityLookupEntity(body: {
    alias_id?: string;
    alias_mount_accessor?: string;
    alias_name?: string;
    id?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/lookup/entity", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Query groups based on various properties.
 */
export async function postIdentityLookupGroup(body: {
    alias_id?: string;
    alias_mount_accessor?: string;
    alias_name?: string;
    id?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/lookup/group", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Retrieve public keys
 */
export async function getIdentityOidcWellKnownKeys(opts?: RequestOpts) {
    return await _.fetch("/identity/oidc/.well-known/keys", {
        ...opts
    });
}
/**
 * Query OIDC configurations
 */
export async function getIdentityOidcWellKnownOpenidConfiguration(opts?: RequestOpts) {
    return await _.fetch("/identity/oidc/.well-known/openid-configuration", {
        ...opts
    });
}
/**
 * OIDC configuration
 */
export async function getIdentityOidcConfig(opts?: RequestOpts) {
    return await _.fetch("/identity/oidc/config", {
        ...opts
    });
}
/**
 * OIDC configuration
 */
export async function postIdentityOidcConfig(body: {
    issuer?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/oidc/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Verify the authenticity of an OIDC token
 */
export async function postIdentityOidcIntrospect(body: {
    client_id?: string;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/oidc/introspect", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List OIDC keys
 */
export async function getIdentityOidcKey({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/key${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * CRUD operations for OIDC keys.
 */
export async function getIdentityOidcKeyName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/key/${name}`, {
        ...opts
    });
}
/**
 * CRUD operations for OIDC keys.
 */
export async function postIdentityOidcKeyName(name: string, body: {
    algorithm?: string;
    allowed_client_ids?: string[];
    rotation_period?: number;
    verification_ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/key/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * CRUD operations for OIDC keys.
 */
export async function deleteIdentityOidcKeyName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/key/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Rotate a named OIDC key.
 */
export async function postIdentityOidcKeyNameRotate(name: string, body: {
    verification_ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/key/${name}/rotate`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List configured OIDC roles
 */
export async function getIdentityOidcRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * CRUD operations on OIDC Roles
 */
export async function getIdentityOidcRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/role/${name}`, {
        ...opts
    });
}
/**
 * CRUD operations on OIDC Roles
 */
export async function postIdentityOidcRoleName(name: string, body: {
    client_id?: string;
    key?: string;
    template?: string;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * CRUD operations on OIDC Roles
 */
export async function deleteIdentityOidcRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Generate an OIDC token
 */
export async function getIdentityOidcTokenName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/oidc/token/${name}`, {
        ...opts
    });
}
/**
 * Create a new alias.
 */
export async function postIdentityPersona(body: {
    entity_id?: string;
    id?: string;
    metadata?: object;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/identity/persona", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List all the alias IDs.
 */
export async function getIdentityPersonaId({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/identity/persona/id${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function getIdentityPersonaIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/persona/id/${id}`, {
        ...opts
    });
}
/**
 * Update, read or delete an alias ID.
 */
export async function postIdentityPersonaIdId(id: string, body: {
    entity_id?: string;
    metadata?: object;
    mount_accessor?: string;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/identity/persona/id/${id}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Update, read or delete an alias ID.
 */
export async function deleteIdentityPersonaIdId(id: string, opts?: RequestOpts) {
    return await _.fetch(`/identity/persona/id/${id}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Pass-through secret storage to the storage backend, allowing you to
 * read/write arbitrary data into secret storage.
 */
export async function getKvPath(path: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/kv/${path}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Pass-through secret storage to the storage backend, allowing you to
 * read/write arbitrary data into secret storage.
 */
export async function postKvPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/kv/${path}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Pass-through secret storage to the storage backend, allowing you to
 * read/write arbitrary data into secret storage.
 */
export async function deleteKvPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/kv/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the connection string to talk to MongoDB.
 */
export async function getMongodbConfigConnection(opts?: RequestOpts) {
    return await _.fetch("/mongodb/config/connection", {
        ...opts
    });
}
/**
 * Configure the connection string to talk to MongoDB.
 */
export async function postMongodbConfigConnection(body: {
    uri?: string;
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/mongodb/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the default lease TTL settings for credentials
 * generated by the mongodb backend.
 */
export async function getMongodbConfigLease(opts?: RequestOpts) {
    return await _.fetch("/mongodb/config/lease", {
        ...opts
    });
}
/**
 * Configure the default lease TTL settings for credentials
 * generated by the mongodb backend.
 */
export async function postMongodbConfigLease(body: {
    max_ttl?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/mongodb/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request MongoDB database credentials for a particular role.
 */
export async function getMongodbCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodb/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles used to generate MongoDB credentials.
 */
export async function getMongodbRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/mongodb/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles used to generate MongoDB credentials.
 */
export async function getMongodbRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodb/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles used to generate MongoDB credentials.
 */
export async function postMongodbRolesName(name: string, body: {
    db?: string;
    roles?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/mongodb/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles used to generate MongoDB credentials.
 */
export async function deleteMongodbRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodb/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the  credentials that are used to manage Database Users.
 */
export async function getMongodbatlasConfig(opts?: RequestOpts) {
    return await _.fetch("/mongodbatlas/config", {
        ...opts
    });
}
/**
 * Configure the  credentials that are used to manage Database Users.
 */
export async function postMongodbatlasConfig(body: {
    private_key: string;
    public_key: string;
}, opts?: RequestOpts) {
    return await _.fetch("/mongodbatlas/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate MongoDB Atlas Programmatic API from a specific Vault role.
 */
export async function getMongodbatlasCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/creds/${name}`, {
        ...opts
    });
}
/**
 * Generate MongoDB Atlas Programmatic API from a specific Vault role.
 */
export async function postMongodbatlasCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/creds/${name}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * List the existing roles in this backend
 */
export async function getMongodbatlasRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles used to generate MongoDB Atlas Programmatic API Keys.
 */
export async function getMongodbatlasRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles used to generate MongoDB Atlas Programmatic API Keys.
 */
export async function postMongodbatlasRolesName(name: string, body: {
    cidr_blocks?: string[];
    ip_addresses?: string[];
    max_ttl?: number;
    organization_id?: string;
    project_id?: string;
    project_roles?: string[];
    roles: string[];
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles used to generate MongoDB Atlas Programmatic API Keys.
 */
export async function deleteMongodbatlasRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mongodbatlas/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the connection string to talk to Microsoft Sql Server.
 */
export async function getMssqlConfigConnection(opts?: RequestOpts) {
    return await _.fetch("/mssql/config/connection", {
        ...opts
    });
}
/**
 * Configure the connection string to talk to Microsoft Sql Server.
 */
export async function postMssqlConfigConnection(body: {
    connection_string?: string;
    max_open_connections?: number;
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/mssql/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the default lease ttl for generated credentials.
 */
export async function getMssqlConfigLease(opts?: RequestOpts) {
    return await _.fetch("/mssql/config/lease", {
        ...opts
    });
}
/**
 * Configure the default lease ttl for generated credentials.
 */
export async function postMssqlConfigLease(body: {
    max_ttl?: string;
    ttl?: string;
    ttl_max?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/mssql/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request database credentials for a certain role.
 */
export async function getMssqlCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mssql/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getMssqlRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/mssql/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getMssqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mssql/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postMssqlRolesName(name: string, body: {
    sql?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/mssql/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deleteMssqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mssql/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the connection string to talk to MySQL.
 */
export async function getMysqlConfigConnection(opts?: RequestOpts) {
    return await _.fetch("/mysql/config/connection", {
        ...opts
    });
}
/**
 * Configure the connection string to talk to MySQL.
 */
export async function postMysqlConfigConnection(body: {
    connection_url?: string;
    max_idle_connections?: number;
    max_open_connections?: number;
    value?: string;
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/mysql/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function getMysqlConfigLease(opts?: RequestOpts) {
    return await _.fetch("/mysql/config/lease", {
        ...opts
    });
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function postMysqlConfigLease(body: {
    lease?: string;
    lease_max?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/mysql/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request database credentials for a certain role.
 */
export async function getMysqlCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mysql/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getMysqlRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/mysql/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getMysqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mysql/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postMysqlRolesName(name: string, body: {
    displayname_length?: number;
    revocation_sql?: string;
    rolename_length?: number;
    sql?: string;
    username_length?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/mysql/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deleteMysqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/mysql/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getNomadConfigAccess(opts?: RequestOpts) {
    return await _.fetch("/nomad/config/access", {
        ...opts
    });
}
export async function postNomadConfigAccess(body: {
    address?: string;
    ca_cert?: string;
    client_cert?: string;
    client_key?: string;
    max_token_name_length?: number;
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/nomad/config/access", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteNomadConfigAccess(opts?: RequestOpts) {
    return await _.fetch("/nomad/config/access", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the lease parameters for generated tokens
 */
export async function getNomadConfigLease(opts?: RequestOpts) {
    return await _.fetch("/nomad/config/lease", {
        ...opts
    });
}
/**
 * Configure the lease parameters for generated tokens
 */
export async function postNomadConfigLease(body: {
    max_ttl?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/nomad/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the lease parameters for generated tokens
 */
export async function deleteNomadConfigLease(opts?: RequestOpts) {
    return await _.fetch("/nomad/config/lease", {
        ...opts,
        method: "DELETE"
    });
}
export async function getNomadCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/nomad/creds/${name}`, {
        ...opts
    });
}
export async function getNomadRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/nomad/role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getNomadRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/nomad/role/${name}`, {
        ...opts
    });
}
export async function postNomadRoleName(name: string, body: {
    "global"?: boolean;
    policies?: string[];
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/nomad/role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteNomadRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/nomad/role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
export async function getOpenldapConfig(opts?: RequestOpts) {
    return await _.fetch("/openldap/config", {
        ...opts
    });
}
export async function postOpenldapConfig(body: {
    anonymous_group_search?: boolean;
    binddn?: string;
    bindpass?: string;
    case_sensitive_names?: boolean;
    certificate?: string;
    client_tls_cert?: string;
    client_tls_key?: string;
    deny_null_bind?: boolean;
    discoverdn?: boolean;
    groupattr?: string;
    groupdn?: string;
    groupfilter?: string;
    insecure_tls?: boolean;
    length?: number;
    max_ttl?: number;
    password_policy?: string;
    request_timeout?: number;
    schema?: string;
    starttls?: boolean;
    tls_max_version?: "tls10" | "tls11" | "tls12" | "tls13";
    tls_min_version?: "tls10" | "tls11" | "tls12" | "tls13";
    ttl?: number;
    upndomain?: string;
    url?: string;
    use_pre111_group_cn_behavior?: boolean;
    use_token_groups?: boolean;
    userattr?: string;
    userdn?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/openldap/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteOpenldapConfig(opts?: RequestOpts) {
    return await _.fetch("/openldap/config", {
        ...opts,
        method: "DELETE"
    });
}
export async function postOpenldapRotateRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/openldap/rotate-role/${name}`, {
        ...opts,
        method: "POST"
    });
}
export async function postOpenldapRotateRoot(opts?: RequestOpts) {
    return await _.fetch("/openldap/rotate-root", {
        ...opts,
        method: "POST"
    });
}
export async function getOpenldapStaticCredName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/openldap/static-cred/${name}`, {
        ...opts
    });
}
export async function getOpenldapStaticRole({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/openldap/static-role${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getOpenldapStaticRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/openldap/static-role/${name}`, {
        ...opts
    });
}
export async function postOpenldapStaticRoleName(name: string, body: {
    dn?: string;
    rotation_period?: number;
    ttl?: number;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/openldap/static-role/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteOpenldapStaticRoleName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/openldap/static-role/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCa(opts?: RequestOpts) {
    return await _.fetch("/pki/ca", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCaPem(opts?: RequestOpts) {
    return await _.fetch("/pki/ca/pem", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCaChain(opts?: RequestOpts) {
    return await _.fetch("/pki/ca_chain", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCertCaChain(opts?: RequestOpts) {
    return await _.fetch("/pki/cert/ca_chain", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCertCrl(opts?: RequestOpts) {
    return await _.fetch("/pki/cert/crl", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCertSerial(serial: string, opts?: RequestOpts) {
    return await _.fetch(`/pki/cert/${serial}`, {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCerts({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/pki/certs${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Set the CA certificate and private key used for generated credentials.
 */
export async function postPkiConfigCa(body: {
    pem_bundle?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/config/ca", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the CRL expiration.
 */
export async function getPkiConfigCrl(opts?: RequestOpts) {
    return await _.fetch("/pki/config/crl", {
        ...opts
    });
}
/**
 * Configure the CRL expiration.
 */
export async function postPkiConfigCrl(body: {
    disable?: boolean;
    expiry?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/config/crl", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Set the URLs for the issuing CA, CRL distribution points, and OCSP servers.
 */
export async function getPkiConfigUrls(opts?: RequestOpts) {
    return await _.fetch("/pki/config/urls", {
        ...opts
    });
}
/**
 * Set the URLs for the issuing CA, CRL distribution points, and OCSP servers.
 */
export async function postPkiConfigUrls(body: {
    crl_distribution_points?: string[];
    issuing_certificates?: string[];
    ocsp_servers?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/pki/config/urls", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCrl(opts?: RequestOpts) {
    return await _.fetch("/pki/crl", {
        ...opts
    });
}
/**
 * Fetch a CA, CRL, CA Chain, or non-revoked certificate.
 */
export async function getPkiCrlPem(opts?: RequestOpts) {
    return await _.fetch("/pki/crl/pem", {
        ...opts
    });
}
/**
 * Force a rebuild of the CRL.
 */
export async function getPkiCrlRotate(opts?: RequestOpts) {
    return await _.fetch("/pki/crl/rotate", {
        ...opts
    });
}
/**
 * Generate a new CSR and private key used for signing.
 */
export async function postPkiIntermediateGenerateExported(exported: string, body: {
    add_basic_constraints?: boolean;
    alt_names?: string;
    common_name?: string;
    country?: string[];
    exclude_cn_from_sans?: boolean;
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    key_bits?: number;
    key_type?: "rsa" | "ec";
    locality?: string[];
    organization?: string[];
    other_sans?: string[];
    ou?: string[];
    postal_code?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    province?: string[];
    serial_number?: string;
    street_address?: string[];
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/intermediate/generate/${exported}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Provide the signed intermediate CA cert.
 */
export async function postPkiIntermediateSetSigned(body: {
    certificate?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/intermediate/set-signed", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request a certificate using a certain role with the provided details.
 */
export async function postPkiIssueRole(role: string, body: {
    alt_names?: string;
    common_name?: string;
    exclude_cn_from_sans?: boolean;
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    other_sans?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    serial_number?: string;
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/issue/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revoke a certificate by serial number.
 */
export async function postPkiRevoke(body: {
    serial_number?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/revoke", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List the existing roles in this backend
 */
export async function getPkiRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/pki/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getPkiRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/pki/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postPkiRolesName(name: string, body: {
    allow_any_name?: boolean;
    allow_bare_domains?: boolean;
    allow_glob_domains?: boolean;
    allow_ip_sans?: boolean;
    allow_localhost?: boolean;
    allow_subdomains?: boolean;
    allowed_domains?: string[];
    allowed_other_sans?: string[];
    allowed_serial_numbers?: string[];
    allowed_uri_sans?: string[];
    backend?: string;
    basic_constraints_valid_for_non_ca?: boolean;
    client_flag?: boolean;
    code_signing_flag?: boolean;
    country?: string[];
    email_protection_flag?: boolean;
    enforce_hostnames?: boolean;
    ext_key_usage?: string[];
    ext_key_usage_oids?: string[];
    generate_lease?: boolean;
    key_bits?: number;
    key_type?: "rsa" | "ec";
    key_usage?: string[];
    locality?: string[];
    max_ttl?: number;
    no_store?: boolean;
    not_before_duration?: number;
    organization?: string[];
    ou?: string[];
    policy_identifiers?: string[];
    postal_code?: string[];
    province?: string[];
    require_cn?: boolean;
    server_flag?: boolean;
    street_address?: string[];
    ttl?: number;
    use_csr_common_name?: boolean;
    use_csr_sans?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deletePkiRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/pki/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Deletes the root CA key to allow a new one to be generated.
 */
export async function deletePkiRoot(opts?: RequestOpts) {
    return await _.fetch("/pki/root", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Generate a new CA certificate and private key used for signing.
 */
export async function postPkiRootGenerateExported(exported: string, body: {
    alt_names?: string;
    common_name?: string;
    country?: string[];
    exclude_cn_from_sans?: boolean;
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    key_bits?: number;
    key_type?: "rsa" | "ec";
    locality?: string[];
    max_path_length?: number;
    organization?: string[];
    other_sans?: string[];
    ou?: string[];
    permitted_dns_domains?: string[];
    postal_code?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    province?: string[];
    serial_number?: string;
    street_address?: string[];
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/root/generate/${exported}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Issue an intermediate CA certificate based on the provided CSR.
 */
export async function postPkiRootSignIntermediate(body: {
    alt_names?: string;
    common_name?: string;
    country?: string[];
    csr?: string;
    exclude_cn_from_sans?: boolean;
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    locality?: string[];
    max_path_length?: number;
    organization?: string[];
    other_sans?: string[];
    ou?: string[];
    permitted_dns_domains?: string[];
    postal_code?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    province?: string[];
    serial_number?: string;
    street_address?: string[];
    ttl?: number;
    uri_sans?: string[];
    use_csr_values?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/root/sign-intermediate", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Signs another CA's self-issued certificate.
 */
export async function postPkiRootSignSelfIssued(body: {
    certificate?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/root/sign-self-issued", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request certificates using a certain role with the provided details.
 */
export async function postPkiSignVerbatim(body: {
    alt_names?: string;
    common_name?: string;
    csr?: string;
    exclude_cn_from_sans?: boolean;
    ext_key_usage?: string[];
    ext_key_usage_oids?: string[];
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    key_usage?: string[];
    other_sans?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    role?: string;
    serial_number?: string;
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/pki/sign-verbatim", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request certificates using a certain role with the provided details.
 */
export async function postPkiSignVerbatimRole(role: string, body: {
    alt_names?: string;
    common_name?: string;
    csr?: string;
    exclude_cn_from_sans?: boolean;
    ext_key_usage?: string[];
    ext_key_usage_oids?: string[];
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    key_usage?: string[];
    other_sans?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    serial_number?: string;
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/sign-verbatim/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request certificates using a certain role with the provided details.
 */
export async function postPkiSignRole(role: string, body: {
    alt_names?: string;
    common_name?: string;
    csr?: string;
    exclude_cn_from_sans?: boolean;
    format?: "pem" | "der" | "pem_bundle";
    ip_sans?: string[];
    other_sans?: string[];
    private_key_format?: "" | "der" | "pem" | "pkcs8";
    serial_number?: string;
    ttl?: number;
    uri_sans?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/pki/sign/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Tidy up the backend by removing expired certificates, revocation information,
 * or both.
 */
export async function postPkiTidy(body: {
    safety_buffer?: number;
    tidy_cert_store?: boolean;
    tidy_revocation_list?: boolean;
    tidy_revoked_certs?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/pki/tidy", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the connection string to talk to PostgreSQL.
 */
export async function getPostgresqlConfigConnection(opts?: RequestOpts) {
    return await _.fetch("/postgresql/config/connection", {
        ...opts
    });
}
/**
 * Configure the connection string to talk to PostgreSQL.
 */
export async function postPostgresqlConfigConnection(body: {
    connection_url?: string;
    max_idle_connections?: number;
    max_open_connections?: number;
    value?: string;
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/postgresql/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function getPostgresqlConfigLease(opts?: RequestOpts) {
    return await _.fetch("/postgresql/config/lease", {
        ...opts
    });
}
/**
 * Configure the default lease information for generated credentials.
 */
export async function postPostgresqlConfigLease(body: {
    lease?: string;
    lease_max?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/postgresql/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request database credentials for a certain role.
 */
export async function getPostgresqlCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/postgresql/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getPostgresqlRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/postgresql/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getPostgresqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/postgresql/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postPostgresqlRolesName(name: string, body: {
    revocation_sql?: string;
    sql?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/postgresql/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deletePostgresqlRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/postgresql/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure the connection URI, username, and password to talk to RabbitMQ management HTTP API.
 */
export async function postRabbitmqConfigConnection(body: {
    connection_uri?: string;
    password?: string;
    password_policy?: string;
    username?: string;
    verify_connection?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/rabbitmq/config/connection", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configure the lease parameters for generated credentials
 */
export async function getRabbitmqConfigLease(opts?: RequestOpts) {
    return await _.fetch("/rabbitmq/config/lease", {
        ...opts
    });
}
/**
 * Configure the lease parameters for generated credentials
 */
export async function postRabbitmqConfigLease(body: {
    max_ttl?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/rabbitmq/config/lease", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Request RabbitMQ credentials for a certain role.
 */
export async function getRabbitmqCredsName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/rabbitmq/creds/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getRabbitmqRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/rabbitmq/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function getRabbitmqRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/rabbitmq/roles/${name}`, {
        ...opts
    });
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function postRabbitmqRolesName(name: string, body: {
    tags?: string;
    vhost_topics?: string;
    vhosts?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/rabbitmq/roles/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the roles that can be created with this backend.
 */
export async function deleteRabbitmqRolesName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/rabbitmq/roles/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the backend level settings.
 */
export async function getSecretConfig(opts?: RequestOpts) {
    return await _.fetch("/secret/config", {
        ...opts
    });
}
/**
 * Configure backend level settings that are applied to every key in the key-value store.
 */
export async function postSecretConfig(body: {
    cas_required?: boolean;
    delete_version_after?: number;
    max_versions?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/secret/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Write, Read, and Delete data in the Key-Value Store.
 */
export async function getSecretDataPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/secret/data/${path}`, {
        ...opts
    });
}
/**
 * Write, Read, and Delete data in the Key-Value Store.
 */
export async function postSecretDataPath(path: string, body: {
    data?: object;
    options?: object;
    version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/secret/data/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Write, Read, and Delete data in the Key-Value Store.
 */
export async function deleteSecretDataPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/secret/data/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Marks one or more versions as deleted in the KV store.
 */
export async function postSecretDeletePath(path: string, body: {
    versions?: number[];
}, opts?: RequestOpts) {
    return await _.fetch(`/secret/delete/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Permanently removes one or more versions in the KV store
 */
export async function postSecretDestroyPath(path: string, body: {
    versions?: number[];
}, opts?: RequestOpts) {
    return await _.fetch(`/secret/destroy/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configures settings for the KV store
 */
export async function getSecretMetadataPath(path: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/secret/metadata/${path}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Configures settings for the KV store
 */
export async function postSecretMetadataPath(path: string, body: {
    cas_required?: boolean;
    delete_version_after?: number;
    max_versions?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/secret/metadata/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Configures settings for the KV store
 */
export async function deleteSecretMetadataPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/secret/metadata/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Undeletes one or more versions from the KV store.
 */
export async function postSecretUndeletePath(path: string, body: {
    versions?: number[];
}, opts?: RequestOpts) {
    return await _.fetch(`/secret/undelete/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Set the SSH private key used for signing certificates.
 */
export async function getSshConfigCa(opts?: RequestOpts) {
    return await _.fetch("/ssh/config/ca", {
        ...opts
    });
}
/**
 * Set the SSH private key used for signing certificates.
 */
export async function postSshConfigCa(body: {
    generate_signing_key?: boolean;
    private_key?: string;
    public_key?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/ssh/config/ca", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Set the SSH private key used for signing certificates.
 */
export async function deleteSshConfigCa(opts?: RequestOpts) {
    return await _.fetch("/ssh/config/ca", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Assign zero address as default CIDR block for select roles.
 */
export async function getSshConfigZeroaddress(opts?: RequestOpts) {
    return await _.fetch("/ssh/config/zeroaddress", {
        ...opts
    });
}
/**
 * Assign zero address as default CIDR block for select roles.
 */
export async function postSshConfigZeroaddress(body: {
    roles?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/ssh/config/zeroaddress", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Assign zero address as default CIDR block for select roles.
 */
export async function deleteSshConfigZeroaddress(opts?: RequestOpts) {
    return await _.fetch("/ssh/config/zeroaddress", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Creates a credential for establishing SSH connection with the remote host.
 */
export async function postSshCredsRole(role: string, body: {
    ip?: string;
    username?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/ssh/creds/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Register a shared private key with Vault.
 */
export async function postSshKeysKeyName(keyName: string, body: {
    key?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/ssh/keys/${keyName}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Register a shared private key with Vault.
 */
export async function deleteSshKeysKeyName(keyName: string, opts?: RequestOpts) {
    return await _.fetch(`/ssh/keys/${keyName}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * List all the roles associated with the given IP address.
 */
export async function postSshLookup(body: {
    ip?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/ssh/lookup", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Retrieve the public key.
 */
export async function getSshPublicKey(opts?: RequestOpts) {
    return await _.fetch("/ssh/public_key", {
        ...opts
    });
}
/**
 * Manage the 'roles' that can be created with this backend.
 */
export async function getSshRoles({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/ssh/roles${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the 'roles' that can be created with this backend.
 */
export async function getSshRolesRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/ssh/roles/${role}`, {
        ...opts
    });
}
/**
 * Manage the 'roles' that can be created with this backend.
 */
export async function postSshRolesRole(role: string, body: {
    admin_user?: string;
    algorithm_signer?: string;
    allow_bare_domains?: boolean;
    allow_host_certificates?: boolean;
    allow_subdomains?: boolean;
    allow_user_certificates?: boolean;
    allow_user_key_ids?: boolean;
    allowed_critical_options?: string;
    allowed_domains?: string;
    allowed_extensions?: string;
    allowed_user_key_lengths?: object;
    allowed_users?: string;
    allowed_users_template?: boolean;
    cidr_list?: string;
    default_critical_options?: object;
    default_extensions?: object;
    default_user?: string;
    exclude_cidr_list?: string;
    install_script?: string;
    key?: string;
    key_bits?: number;
    key_id_format?: string;
    key_option_specs?: string;
    key_type?: "otp" | "dynamic" | "ca";
    max_ttl?: number;
    port?: number;
    ttl?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/ssh/roles/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the 'roles' that can be created with this backend.
 */
export async function deleteSshRolesRole(role: string, opts?: RequestOpts) {
    return await _.fetch(`/ssh/roles/${role}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Request signing an SSH key using a certain role with the provided details.
 */
export async function postSshSignRole(role: string, body: {
    cert_type?: string;
    critical_options?: object;
    extensions?: object;
    key_id?: string;
    public_key?: string;
    ttl?: number;
    valid_principals?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/ssh/sign/${role}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Validate the OTP provided by Vault SSH Agent.
 */
export async function postSshVerify(body: {
    otp?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/ssh/verify", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List the enabled audit devices.
 */
export async function getSysAudit(opts?: RequestOpts) {
    return await _.fetch("/sys/audit", {
        ...opts
    });
}
/**
 * The hash of the given string via the given audit backend
 */
export async function postSysAuditHashPath(path: string, body: {
    input?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/audit-hash/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Enable a new audit device at the supplied path.
 */
export async function postSysAuditPath(path: string, body: {
    description?: string;
    local?: boolean;
    options?: object;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/audit/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Disable the audit device at the given path.
 */
export async function deleteSysAuditPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/audit/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * List the currently enabled credential backends.
 */
export async function getSysAuth(opts?: RequestOpts) {
    return await _.fetch("/sys/auth", {
        ...opts
    });
}
/**
 * Enables a new auth method.
 */
export async function postSysAuthPath(path: string, body: {
    config?: object;
    description?: string;
    external_entropy_access?: boolean;
    local?: boolean;
    options?: object;
    plugin_name?: string;
    seal_wrap?: boolean;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/auth/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Disable the auth method at the given auth path
 */
export async function deleteSysAuthPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/auth/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Reads the given auth path's configuration.
 */
export async function getSysAuthPathTune(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/auth/${path}/tune`, {
        ...opts
    });
}
/**
 * Tune configuration parameters for a given auth path.
 */
export async function postSysAuthPathTune(path: string, body: {
    allowed_response_headers?: string[];
    audit_non_hmac_request_keys?: string[];
    audit_non_hmac_response_keys?: string[];
    default_lease_ttl?: string;
    description?: string;
    listing_visibility?: string;
    max_lease_ttl?: string;
    options?: object;
    passthrough_request_headers?: string[];
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/auth/${path}/tune`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Fetches the capabilities of the given token on the given path.
 */
export async function postSysCapabilities(body: {
    path?: string[];
    paths?: string[];
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/capabilities", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Fetches the capabilities of the token associated with the given token, on the given path.
 */
export async function postSysCapabilitiesAccessor(body: {
    accessor?: string;
    path?: string[];
    paths?: string[];
}, opts?: RequestOpts) {
    return await _.fetch("/sys/capabilities-accessor", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Fetches the capabilities of the given token on the given path.
 */
export async function postSysCapabilitiesSelf(body: {
    path?: string[];
    paths?: string[];
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/capabilities-self", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List the request headers that are configured to be audited.
 */
export async function getSysConfigAuditingRequestHeaders(opts?: RequestOpts) {
    return await _.fetch("/sys/config/auditing/request-headers", {
        ...opts
    });
}
/**
 * List the information for the given request header.
 */
export async function getSysConfigAuditingRequestHeadersHeader(header: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/auditing/request-headers/${header}`, {
        ...opts
    });
}
/**
 * Enable auditing of a header.
 */
export async function postSysConfigAuditingRequestHeadersHeader(header: string, body: {
    hmac?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/auditing/request-headers/${header}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Disable auditing of the given request header.
 */
export async function deleteSysConfigAuditingRequestHeadersHeader(header: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/auditing/request-headers/${header}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Return the current CORS settings.
 */
export async function getSysConfigCors(opts?: RequestOpts) {
    return await _.fetch("/sys/config/cors", {
        ...opts
    });
}
/**
 * Configure the CORS settings.
 */
export async function postSysConfigCors(body: {
    allowed_headers?: string[];
    allowed_origins?: string[];
    enable?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/config/cors", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Remove any CORS settings.
 */
export async function deleteSysConfigCors(opts?: RequestOpts) {
    return await _.fetch("/sys/config/cors", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Return a sanitized version of the Vault server configuration.
 */
export async function getSysConfigStateSanitized(opts?: RequestOpts) {
    return await _.fetch("/sys/config/state/sanitized", {
        ...opts
    });
}
/**
 * Return a list of configured UI headers.
 */
export async function getSysConfigUiHeaders({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/ui/headers/${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Return the given UI header's configuration
 */
export async function getSysConfigUiHeadersHeader(header: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/ui/headers/${header}`, {
        ...opts
    });
}
/**
 * Configure the values to be returned for the UI header.
 */
export async function postSysConfigUiHeadersHeader(header: string, body: {
    values?: string[];
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/ui/headers/${header}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Remove a UI header.
 */
export async function deleteSysConfigUiHeadersHeader(header: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/config/ui/headers/${header}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the configuration and progress of the current root generation attempt.
 */
export async function getSysGenerateRoot(opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root", {
        ...opts
    });
}
/**
 * Initializes a new root generation attempt.
 */
export async function postSysGenerateRoot(body: {
    pgp_key?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Cancels any in-progress root generation attempt.
 */
export async function deleteSysGenerateRoot(opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the configuration and progress of the current root generation attempt.
 */
export async function getSysGenerateRootAttempt(opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root/attempt", {
        ...opts
    });
}
/**
 * Initializes a new root generation attempt.
 */
export async function postSysGenerateRootAttempt(body: {
    pgp_key?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root/attempt", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Cancels any in-progress root generation attempt.
 */
export async function deleteSysGenerateRootAttempt(opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root/attempt", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Enter a single master key share to progress the root generation attempt.
 */
export async function postSysGenerateRootUpdate(body: {
    key?: string;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/generate-root/update", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Returns the health status of Vault.
 */
export async function getSysHealth(opts?: RequestOpts) {
    return await _.fetch("/sys/health", {
        ...opts
    });
}
/**
 * Information about the host instance that this Vault server is running on.
 */
export async function getSysHostInfo(opts?: RequestOpts) {
    return await _.fetch("/sys/host-info", {
        ...opts
    });
}
/**
 * Returns the initialization status of Vault.
 */
export async function getSysInit(opts?: RequestOpts) {
    return await _.fetch("/sys/init", {
        ...opts
    });
}
/**
 * Initialize a new Vault.
 */
export async function postSysInit(body: {
    pgp_keys?: string[];
    recovery_pgp_keys?: string[];
    recovery_shares?: number;
    recovery_threshold?: number;
    root_token_pgp_key?: string;
    secret_shares?: number;
    secret_threshold?: number;
    stored_shares?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/init", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate an OpenAPI 3 document of all mounted paths.
 */
export async function getSysInternalSpecsOpenapi(opts?: RequestOpts) {
    return await _.fetch("/sys/internal/specs/openapi", {
        ...opts
    });
}
/**
 * Lists all enabled and visible auth and secrets mounts.
 */
export async function getSysInternalUiMounts(opts?: RequestOpts) {
    return await _.fetch("/sys/internal/ui/mounts", {
        ...opts
    });
}
/**
 * Return information about the given mount.
 */
export async function getSysInternalUiMountsPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/internal/ui/mounts/${path}`, {
        ...opts
    });
}
/**
 * Provides information about the backend encryption key.
 */
export async function getSysKeyStatus(opts?: RequestOpts) {
    return await _.fetch("/sys/key-status", {
        ...opts
    });
}
/**
 * Returns the high availability status and current leader instance of Vault.
 */
export async function getSysLeader(opts?: RequestOpts) {
    return await _.fetch("/sys/leader", {
        ...opts
    });
}
/**
 * Retrieve lease metadata.
 */
export async function postSysLeasesLookup(body: {
    lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/leases/lookup", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Returns a list of lease ids.
 */
export async function getSysLeasesLookup({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/lookup/${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Returns a list of lease ids.
 */
export async function getSysLeasesLookupPrefix(prefix: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/lookup/${prefix}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Renews a lease, requesting to extend the lease.
 */
export async function postSysLeasesRenew(body: {
    increment?: number;
    lease_id?: string;
    url_lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/leases/renew", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Renews a lease, requesting to extend the lease.
 */
export async function postSysLeasesRenewUrlLeaseId(urlLeaseId: string, body: {
    increment?: number;
    lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/renew/${urlLeaseId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revokes a lease immediately.
 */
export async function postSysLeasesRevoke(body: {
    lease_id?: string;
    sync?: boolean;
    url_lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/leases/revoke", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revokes all secrets or tokens generated under a given prefix immediately
 */
export async function postSysLeasesRevokeForcePrefix(prefix: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/revoke-force/${prefix}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Revokes all secrets (via a lease ID prefix) or tokens (via the tokens' path property) generated under a given prefix immediately.
 */
export async function postSysLeasesRevokePrefixPrefix(prefix: string, body: {
    sync?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/revoke-prefix/${prefix}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revokes a lease immediately.
 */
export async function postSysLeasesRevokeUrlLeaseId(urlLeaseId: string, body: {
    lease_id?: string;
    sync?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/leases/revoke/${urlLeaseId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * This endpoint performs cleanup tasks that can be run if certain error
 * conditions have occurred.
 */
export async function postSysLeasesTidy(opts?: RequestOpts) {
    return await _.fetch("/sys/leases/tidy", {
        ...opts,
        method: "POST"
    });
}
/**
 * Export the metrics aggregated for telemetry purpose.
 */
export async function getSysMetrics({ format }: {
    format?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/metrics${QS.query(QS.form({
        format
    }))}`, {
        ...opts
    });
}
export async function getSysMonitor({ logLevel }: {
    logLevel?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/monitor${QS.query(QS.form({
        log_level: logLevel
    }))}`, {
        ...opts
    });
}
/**
 * List the currently mounted backends.
 */
export async function getSysMounts(opts?: RequestOpts) {
    return await _.fetch("/sys/mounts", {
        ...opts
    });
}
/**
 * Enable a new secrets engine at the given path.
 */
export async function postSysMountsPath(path: string, body: {
    config?: object;
    description?: string;
    external_entropy_access?: boolean;
    local?: boolean;
    options?: object;
    plugin_name?: string;
    seal_wrap?: boolean;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/mounts/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Disable the mount point specified at the given path.
 */
export async function deleteSysMountsPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/mounts/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Tune backend configuration parameters for this mount.
 */
export async function getSysMountsPathTune(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/mounts/${path}/tune`, {
        ...opts
    });
}
/**
 * Tune backend configuration parameters for this mount.
 */
export async function postSysMountsPathTune(path: string, body: {
    allowed_response_headers?: string[];
    audit_non_hmac_request_keys?: string[];
    audit_non_hmac_response_keys?: string[];
    default_lease_ttl?: string;
    description?: string;
    listing_visibility?: string;
    max_lease_ttl?: string;
    options?: object;
    passthrough_request_headers?: string[];
    token_type?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/mounts/${path}/tune`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Lists all the plugins known to Vault
 */
export async function getSysPluginsCatalog(opts?: RequestOpts) {
    return await _.fetch("/sys/plugins/catalog", {
        ...opts
    });
}
/**
 * Return the configuration data for the plugin with the given name.
 */
export async function getSysPluginsCatalogName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${name}`, {
        ...opts
    });
}
/**
 * Register a new plugin, or updates an existing one with the supplied name.
 */
export async function postSysPluginsCatalogName(name: string, body: {
    args?: string[];
    command?: string;
    env?: string[];
    sha256?: string;
    sha_256?: string;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Remove the plugin with the given name.
 */
export async function deleteSysPluginsCatalogName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * List the plugins in the catalog.
 */
export async function getSysPluginsCatalogType(type: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${type}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Return the configuration data for the plugin with the given name.
 */
export async function getSysPluginsCatalogTypeName(name: string, type: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${type}/${name}`, {
        ...opts
    });
}
/**
 * Register a new plugin, or updates an existing one with the supplied name.
 */
export async function postSysPluginsCatalogTypeName(name: string, type: string, body: {
    args?: string[];
    command?: string;
    env?: string[];
    sha256?: string;
    sha_256?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${type}/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Remove the plugin with the given name.
 */
export async function deleteSysPluginsCatalogTypeName(name: string, type: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/plugins/catalog/${type}/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Reload mounted plugin backends.
 */
export async function postSysPluginsReloadBackend(body: {
    mounts?: string[];
    plugin?: string;
    scope?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/plugins/reload/backend", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * List the configured access control policies.
 */
export async function getSysPoliciesAcl({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/acl${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Retrieve information about the named ACL policy.
 */
export async function getSysPoliciesAclName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/acl/${name}`, {
        ...opts
    });
}
/**
 * Add a new or update an existing ACL policy.
 */
export async function postSysPoliciesAclName(name: string, body: {
    policy?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/acl/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete the ACL policy with the given name.
 */
export async function deleteSysPoliciesAclName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/acl/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Retrieve an existing password policy.
 */
export async function getSysPoliciesPasswordName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/password/${name}`, {
        ...opts
    });
}
/**
 * Add a new or update an existing password policy.
 */
export async function postSysPoliciesPasswordName(name: string, body: {
    policy?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/password/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete a password policy.
 */
export async function deleteSysPoliciesPasswordName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/password/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Generate a password from an existing password policy.
 */
export async function getSysPoliciesPasswordNameGenerate(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policies/password/${name}/generate`, {
        ...opts
    });
}
/**
 * List the configured access control policies.
 */
export async function getSysPolicy({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/policy${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Retrieve the policy body for the named policy.
 */
export async function getSysPolicyName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policy/${name}`, {
        ...opts
    });
}
/**
 * Add a new or update an existing policy.
 */
export async function postSysPolicyName(name: string, body: {
    policy?: string;
    rules?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/policy/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete the policy with the given name.
 */
export async function deleteSysPolicyName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/policy/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Returns an HTML page listing the available profiles.
 */
export async function getSysPprof(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/", {
        ...opts
    });
}
/**
 * Returns the running program's command line.
 */
export async function getSysPprofCmdline(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/cmdline", {
        ...opts
    });
}
/**
 * Returns stack traces of all current goroutines.
 */
export async function getSysPprofGoroutine(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/goroutine", {
        ...opts
    });
}
/**
 * Returns a sampling of memory allocations of live object.
 */
export async function getSysPprofHeap(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/heap", {
        ...opts
    });
}
/**
 * Returns a pprof-formatted cpu profile payload.
 */
export async function getSysPprofProfile(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/profile", {
        ...opts
    });
}
/**
 * Returns the program counters listed in the request.
 */
export async function getSysPprofSymbol(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/symbol", {
        ...opts
    });
}
/**
 * Returns the execution trace in binary form.
 */
export async function getSysPprofTrace(opts?: RequestOpts) {
    return await _.fetch("/sys/pprof/trace", {
        ...opts
    });
}
export async function getSysQuotasConfig(opts?: RequestOpts) {
    return await _.fetch("/sys/quotas/config", {
        ...opts
    });
}
export async function postSysQuotasConfig(body: {
    enable_rate_limit_audit_logging?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/quotas/config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getSysQuotasRateLimit({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/quotas/rate-limit${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
export async function getSysQuotasRateLimitName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/quotas/rate-limit/${name}`, {
        ...opts
    });
}
export async function postSysQuotasRateLimitName(name: string, body: {
    path?: string;
    rate?: any;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/quotas/rate-limit/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function deleteSysQuotasRateLimitName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/quotas/rate-limit/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the value of the key at the given path.
 */
export async function getSysRaw({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/raw${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update the value of the key at the given path.
 */
export async function postSysRaw(body: {
    path?: string;
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/raw", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete the key with given path.
 */
export async function deleteSysRaw(opts?: RequestOpts) {
    return await _.fetch("/sys/raw", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Read the value of the key at the given path.
 */
export async function getSysRawPath(path: string, { list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/sys/raw/${path}${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Update the value of the key at the given path.
 */
export async function postSysRawPath(path: string, body: {
    value?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/raw/${path}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete the key with given path.
 */
export async function deleteSysRawPath(path: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/raw/${path}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Return the backup copy of PGP-encrypted unseal keys.
 */
export async function getSysRekeyBackup(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/backup", {
        ...opts
    });
}
/**
 * Delete the backup copy of PGP-encrypted unseal keys.
 */
export async function deleteSysRekeyBackup(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/backup", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Reads the configuration and progress of the current rekey attempt.
 */
export async function getSysRekeyInit(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/init", {
        ...opts
    });
}
/**
 * Initializes a new rekey attempt.
 */
export async function postSysRekeyInit(body: {
    backup?: boolean;
    pgp_keys?: string[];
    require_verification?: boolean;
    secret_shares?: number;
    secret_threshold?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/init", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Cancels any in-progress rekey.
 */
export async function deleteSysRekeyInit(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/init", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Allows fetching or deleting the backup of the rotated unseal keys.
 */
export async function getSysRekeyRecoveryKeyBackup(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/recovery-key-backup", {
        ...opts
    });
}
/**
 * Allows fetching or deleting the backup of the rotated unseal keys.
 */
export async function deleteSysRekeyRecoveryKeyBackup(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/recovery-key-backup", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Enter a single master key share to progress the rekey of the Vault.
 */
export async function postSysRekeyUpdate(body: {
    key?: string;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/update", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Read the configuration and progress of the current rekey verification attempt.
 */
export async function getSysRekeyVerify(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/verify", {
        ...opts
    });
}
/**
 * Enter a single new key share to progress the rekey verification operation.
 */
export async function postSysRekeyVerify(body: {
    key?: string;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/verify", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Cancel any in-progress rekey verification operation.
 */
export async function deleteSysRekeyVerify(opts?: RequestOpts) {
    return await _.fetch("/sys/rekey/verify", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Move the mount point of an already-mounted backend.
 */
export async function postSysRemount(body: {
    "from"?: string;
    to?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/remount", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Renews a lease, requesting to extend the lease.
 */
export async function postSysRenew(body: {
    increment?: number;
    lease_id?: string;
    url_lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/renew", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Renews a lease, requesting to extend the lease.
 */
export async function postSysRenewUrlLeaseId(urlLeaseId: string, body: {
    increment?: number;
    lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/renew/${urlLeaseId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
export async function getSysReplicationStatus(opts?: RequestOpts) {
    return await _.fetch("/sys/replication/status", {
        ...opts
    });
}
/**
 * Revokes a lease immediately.
 */
export async function postSysRevoke(body: {
    lease_id?: string;
    sync?: boolean;
    url_lease_id?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/revoke", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revokes all secrets or tokens generated under a given prefix immediately
 */
export async function postSysRevokeForcePrefix(prefix: string, opts?: RequestOpts) {
    return await _.fetch(`/sys/revoke-force/${prefix}`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Revokes all secrets (via a lease ID prefix) or tokens (via the tokens' path property) generated under a given prefix immediately.
 */
export async function postSysRevokePrefixPrefix(prefix: string, body: {
    sync?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/revoke-prefix/${prefix}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Revokes a lease immediately.
 */
export async function postSysRevokeUrlLeaseId(urlLeaseId: string, body: {
    lease_id?: string;
    sync?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/revoke/${urlLeaseId}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Rotates the backend encryption key used to persist data.
 */
export async function postSysRotate(opts?: RequestOpts) {
    return await _.fetch("/sys/rotate", {
        ...opts,
        method: "POST"
    });
}
/**
 * Seal the Vault.
 */
export async function postSysSeal(opts?: RequestOpts) {
    return await _.fetch("/sys/seal", {
        ...opts,
        method: "POST"
    });
}
/**
 * Check the seal status of a Vault.
 */
export async function getSysSealStatus(opts?: RequestOpts) {
    return await _.fetch("/sys/seal-status", {
        ...opts
    });
}
/**
 * Cause the node to give up active status.
 */
export async function postSysStepDown(opts?: RequestOpts) {
    return await _.fetch("/sys/step-down", {
        ...opts,
        method: "POST"
    });
}
/**
 * Generate a hash sum for input data
 */
export async function postSysToolsHash(body: {
    algorithm?: string;
    format?: string;
    input?: string;
    urlalgorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/tools/hash", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a hash sum for input data
 */
export async function postSysToolsHashUrlalgorithm(urlalgorithm: string, body: {
    algorithm?: string;
    format?: string;
    input?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/tools/hash/${urlalgorithm}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate random bytes
 */
export async function postSysToolsRandom(body: {
    bytes?: number;
    format?: string;
    urlbytes?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/tools/random", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate random bytes
 */
export async function postSysToolsRandomUrlbytes(urlbytes: string, body: {
    bytes?: number;
    format?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/sys/tools/random/${urlbytes}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Unseal the Vault.
 */
export async function postSysUnseal(body: {
    key?: string;
    reset?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/unseal", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Look up wrapping properties for the requester's token.
 */
export async function getSysWrappingLookup(opts?: RequestOpts) {
    return await _.fetch("/sys/wrapping/lookup", {
        ...opts
    });
}
/**
 * Look up wrapping properties for the given token.
 */
export async function postSysWrappingLookup(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/wrapping/lookup", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Rotates a response-wrapped token.
 */
export async function postSysWrappingRewrap(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/wrapping/rewrap", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Unwraps a response-wrapped token.
 */
export async function postSysWrappingUnwrap(body: {
    token?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/sys/wrapping/unwrap", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Response-wraps an arbitrary JSON object.
 */
export async function postSysWrappingWrap(opts?: RequestOpts) {
    return await _.fetch("/sys/wrapping/wrap", {
        ...opts,
        method: "POST"
    });
}
/**
 * Request time-based one-time use password or validate a password for a certain key .
 */
export async function getTotpCodeName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/totp/code/${name}`, {
        ...opts
    });
}
/**
 * Request time-based one-time use password or validate a password for a certain key .
 */
export async function postTotpCodeName(name: string, body: {
    code?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/totp/code/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the keys that can be created with this backend.
 */
export async function getTotpKeys({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/totp/keys${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Manage the keys that can be created with this backend.
 */
export async function getTotpKeysName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/totp/keys/${name}`, {
        ...opts
    });
}
/**
 * Manage the keys that can be created with this backend.
 */
export async function postTotpKeysName(name: string, body: {
    account_name?: string;
    algorithm?: string;
    digits?: number;
    exported?: boolean;
    generate?: boolean;
    issuer?: string;
    key?: string;
    key_size?: number;
    period?: number;
    qr_size?: number;
    skew?: number;
    url?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/totp/keys/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Manage the keys that can be created with this backend.
 */
export async function deleteTotpKeysName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/totp/keys/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Backup the named key
 */
export async function getTransitBackupName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/backup/${name}`, {
        ...opts
    });
}
/**
 * Returns the size of the active cache
 */
export async function getTransitCacheConfig(opts?: RequestOpts) {
    return await _.fetch("/transit/cache-config", {
        ...opts
    });
}
/**
 * Configures a new cache of the specified size
 */
export async function postTransitCacheConfig(body: {
    size?: number;
}, opts?: RequestOpts) {
    return await _.fetch("/transit/cache-config", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a data key
 */
export async function postTransitDatakeyPlaintextName(name: string, plaintext: string, body: {
    bits?: number;
    context?: string;
    key_version?: number;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/datakey/${plaintext}/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Decrypt a ciphertext value using a named key
 */
export async function postTransitDecryptName(name: string, body: {
    ciphertext?: string;
    context?: string;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/decrypt/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Encrypt a plaintext value or a batch of plaintext
 * blocks using a named key
 */
export async function postTransitEncryptName(name: string, body: {
    context?: string;
    convergent_encryption?: boolean;
    key_version?: number;
    nonce?: string;
    plaintext?: string;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/encrypt/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Export named encryption or signing key
 */
export async function getTransitExportTypeName(name: string, type: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/export/${type}/${name}`, {
        ...opts
    });
}
/**
 * Export named encryption or signing key
 */
export async function getTransitExportTypeNameVersion(name: string, type: string, version: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/export/${type}/${name}/${version}`, {
        ...opts
    });
}
/**
 * Generate a hash sum for input data
 */
export async function postTransitHash(body: {
    algorithm?: string;
    format?: string;
    input?: string;
    urlalgorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/transit/hash", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a hash sum for input data
 */
export async function postTransitHashUrlalgorithm(urlalgorithm: string, body: {
    algorithm?: string;
    format?: string;
    input?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/hash/${urlalgorithm}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate an HMAC for input data using the named key
 */
export async function postTransitHmacName(name: string, body: {
    algorithm?: string;
    input?: string;
    key_version?: number;
    urlalgorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/hmac/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate an HMAC for input data using the named key
 */
export async function postTransitHmacNameUrlalgorithm(name: string, urlalgorithm: string, body: {
    algorithm?: string;
    input?: string;
    key_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/hmac/${name}/${urlalgorithm}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Managed named encryption keys
 */
export async function getTransitKeys({ list }: {
    list?: string;
} = {}, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys${QS.query(QS.form({
        list
    }))}`, {
        ...opts
    });
}
/**
 * Managed named encryption keys
 */
export async function getTransitKeysName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}`, {
        ...opts
    });
}
/**
 * Managed named encryption keys
 */
export async function postTransitKeysName(name: string, body: {
    allow_plaintext_backup?: boolean;
    context?: string;
    convergent_encryption?: boolean;
    derived?: boolean;
    exportable?: boolean;
    "type"?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Managed named encryption keys
 */
export async function deleteTransitKeysName(name: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Configure a named encryption key
 */
export async function postTransitKeysNameConfig(name: string, body: {
    allow_plaintext_backup?: boolean;
    deletion_allowed?: boolean;
    exportable?: boolean;
    min_decryption_version?: number;
    min_encryption_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}/config`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Rotate named encryption key
 */
export async function postTransitKeysNameRotate(name: string, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}/rotate`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Trim key versions of a named key
 */
export async function postTransitKeysNameTrim(name: string, body: {
    min_available_version?: number;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/keys/${name}/trim`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate random bytes
 */
export async function postTransitRandom(body: {
    bytes?: number;
    format?: string;
    urlbytes?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/transit/random", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate random bytes
 */
export async function postTransitRandomUrlbytes(urlbytes: string, body: {
    bytes?: number;
    format?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/random/${urlbytes}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Restore the named key
 */
export async function postTransitRestore(body: {
    backup?: string;
    force?: boolean;
    name?: string;
}, opts?: RequestOpts) {
    return await _.fetch("/transit/restore", _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Restore the named key
 */
export async function postTransitRestoreName(name: string, body: {
    backup?: string;
    force?: boolean;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/restore/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Rewrap ciphertext
 */
export async function postTransitRewrapName(name: string, body: {
    ciphertext?: string;
    context?: string;
    key_version?: number;
    nonce?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/rewrap/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a signature for input data using the named key
 */
export async function postTransitSignName(name: string, body: {
    algorithm?: string;
    context?: string;
    hash_algorithm?: string;
    input?: string;
    key_version?: number;
    marshaling_algorithm?: string;
    prehashed?: boolean;
    signature_algorithm?: string;
    urlalgorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/sign/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Generate a signature for input data using the named key
 */
export async function postTransitSignNameUrlalgorithm(name: string, urlalgorithm: string, body: {
    algorithm?: string;
    context?: string;
    hash_algorithm?: string;
    input?: string;
    key_version?: number;
    marshaling_algorithm?: string;
    prehashed?: boolean;
    signature_algorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/sign/${name}/${urlalgorithm}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Verify a signature or HMAC for input data created using the named key
 */
export async function postTransitVerifyName(name: string, body: {
    algorithm?: string;
    context?: string;
    hash_algorithm?: string;
    hmac?: string;
    input?: string;
    marshaling_algorithm?: string;
    prehashed?: boolean;
    signature?: string;
    signature_algorithm?: string;
    urlalgorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/verify/${name}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Verify a signature or HMAC for input data created using the named key
 */
export async function postTransitVerifyNameUrlalgorithm(name: string, urlalgorithm: string, body: {
    algorithm?: string;
    context?: string;
    hash_algorithm?: string;
    hmac?: string;
    input?: string;
    marshaling_algorithm?: string;
    prehashed?: boolean;
    signature?: string;
    signature_algorithm?: string;
}, opts?: RequestOpts) {
    return await _.fetch(`/transit/verify/${name}/${urlalgorithm}`, _.json({
        ...opts,
        method: "POST",
        body
    }));
}

