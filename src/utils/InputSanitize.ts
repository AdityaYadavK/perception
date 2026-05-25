import hpp from 'hpp';
import xss from 'xss-clean';

/*
cross site scripting prevention
{ "name": "<script>alert('XSS')</script>" }
{ "name": "&lt;script&gt;alert('XSS')&lt;/script&gt;" }
*/

export const clean = xss();

/*
http parameter pollution prevention
prevents duplicate query parameter
*/

export const preventPollution = hpp({
    whitelist: ['tags', 'fields']
});