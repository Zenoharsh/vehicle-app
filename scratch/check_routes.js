const fs = require('fs');

const dashboardCode = fs.readFileSync('ui/js/dashboard.js', 'utf8');
const additionsCode = fs.existsSync('ui/js/additions.js') ? fs.readFileSync('ui/js/additions.js', 'utf8') : '';
const allCode = dashboardCode + '\n' + additionsCode;

const apiCalls = [...allCode.matchAll(/api\(['"`](\/api\/[a-zA-Z0-9\-\/]+)/g)].map(m => m[1]);
const uniqueApi = [...new Set(apiCalls)];

const routeFiles = fs.readdirSync('server/routes').filter(f => f.endsWith('.js'));
let definedRoutes = [];
routeFiles.forEach(file => {
    const content = fs.readFileSync('server/routes/' + file, 'utf8');
    const methods = [...content.matchAll(/router\.(get|post|put|delete)\(['"`](\/[a-zA-Z0-9\-\/]*)/g)].map(m => `/api/${file.replace('.js', '')}${m[2]}`);
    definedRoutes.push(...methods);
});

console.log('--- UI API Calls ---');
console.log(uniqueApi.sort());
console.log('\n--- Server Routes (Approx) ---');
console.log(definedRoutes.sort());
