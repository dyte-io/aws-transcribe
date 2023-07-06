import crypto from 'node:crypto';
import querystring from 'query-string';

function toTime(time: string | number | Date) {
    // eslint-disable-next-line no-useless-escape
    return new Date(time).toISOString().replace(/[:\-]|\.\d{3}/g, '');
}

function toDate(time: number) {
    return toTime(time).substring(0, 8);
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, string: string, encoding?: 'base64' | 'base64url' | 'hex' | 'binary') {
    return crypto.createHmac('sha256', key)
        .update(string, 'utf8')
        .digest(encoding);
}

function hash(string: string, encoding: 'base64' | 'base64url' | 'hex' | 'binary') {
    return crypto.createHash('sha256')
        .update(string, 'utf8')
        .digest(encoding);
}

export function createCanonicalQueryString(params: Record<string, any>) {
    return Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
}

export function createCanonicalHeaders(headers : Record<string, any>) {
    return Object.keys(headers).sort().map((name) => `${name.toLowerCase().trim()}:${headers[name].toString().trim()}\n`).join('');
}

export function createSignedHeaders(headers: Record<string, any>) {
    return Object.keys(headers).sort().map((name) => name.toLowerCase().trim()).join(';');
}

export function createCredentialScope(time: number, region: string, service: string) {
    return [toDate(time), region, service, 'aws4_request'].join('/');
}

export function createStringToSign(time: any, region: any, service: any, request: any) {
    return [
        'AWS4-HMAC-SHA256',
        toTime(time),
        createCredentialScope(time, region, service),
        hash(request, 'hex'),
    ].join('\n');
}

export function createCanonicalRequest(
    method: string,
    pathname: any,
    query: any,
    headers: any,
    payload: any,
) {
    return [
        method.toUpperCase(),
        pathname,
        createCanonicalQueryString(query),
        createCanonicalHeaders(headers),
        createSignedHeaders(headers),
        payload,
    ].join('\n');
}

export function createSignature(
    secret: any,
    time: any,
    region: any,
    service: any,
    stringToSign: any,
) {
    const h1 = hmac(`AWS4${secret}`, toDate(time)); // date-key
    const h2 = hmac(h1, region); // region-key
    const h3 = hmac(h2, service); // service-key
    const h4 = hmac(h3, 'aws4_request'); // signing-key
    return hmac(h4, stringToSign, 'hex');
}

export function createPresignedURL(
    method: any,
    host: any,
    path: any,
    service: any,
    payload: any,
    optionParams: {
        key?: any;
        secret?: any;
        protocol?: any;
        headers?: any;
        timestamp?: any;
        region?: any;
        expires?: any;
        query?: any;
        sessionToken?: any;
    },
) {
    const options = optionParams || {};
    options.key = options.key || process.env.AWS_ACCESS_KEY_ID;
    options.secret = options.secret || process.env.AWS_SECRET_ACCESS_KEY;
    options.protocol = options.protocol || 'https';
    options.headers = options.headers || {};
    options.timestamp = options.timestamp || Date.now();
    options.region = options.region || process.env.AWS_REGION || 'us-east-1';
    options.expires = options.expires || 86400; // 24 hours
    options.headers = options.headers || {};

    // host is required
    options.headers.Host = host;

    const query = options.query ? querystring.parse(options.query) : {};
    query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256';
    query['X-Amz-Credential'] = `${options.key}/${createCredentialScope(options.timestamp, options.region, service)}`;
    query['X-Amz-Date'] = toTime(options.timestamp);
    query['X-Amz-Expires'] = options.expires;
    query['X-Amz-SignedHeaders'] = createSignedHeaders(options.headers);
    if (options.sessionToken) {
        query['X-Amz-Security-Token'] = options.sessionToken;
    }

    const canonicalRequest = createCanonicalRequest(
        method,
        path,
        query,
        options.headers,
        payload,
    );
    const stringToSign = createStringToSign(
        options.timestamp,
        options.region,
        service,
        canonicalRequest,
    );
    const signature = createSignature(
        options.secret,
        options.timestamp,
        options.region,
        service,
        stringToSign,
    );
    query['X-Amz-Signature'] = signature;
    return `${options.protocol}://${host}${path}?${querystring.stringify(query)}`;
}
