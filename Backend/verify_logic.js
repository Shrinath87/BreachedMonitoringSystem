const bcrypt = require('bcrypt');
const fs = require('fs');

let createdData = null;

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function () {
    if (arguments[0] === '@prisma/client') {
        return {
            PrismaClient: class {
                get user() {
                    return {
                        findUnique: async (args) => {
                            if (args.where.email === 'existing@example.com') {
                                return { id: 1, email: 'existing@example.com' };
                            }
                            return null;
                        },
                        create: async ({ data }) => {
                            createdData = data;
                            return { id: 99, ...data };
                        }
                    };
                }
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

process.env.JWT_SECRET = 'test_secret';
const authController = require('./controllers/authController.js');

async function runTests() {
    const results = [];

    // Test 1
    let req = { body: { name: 'Alice', email: 'alice@example.com', password: 'SecretPassword123' } };
    let statusRes = 200; let jsonRes = null;
    let res = {
        status: function (code) { statusRes = code; return this; },
        json: function (data) { jsonRes = data; return this; }
    };
    await authController.signup(req, res);

    let isMatched = false;
    if (createdData && createdData.password !== 'SecretPassword123') {
        isMatched = await bcrypt.compare('SecretPassword123', createdData.password);
    }
    results.push({ name: 'TEST 1: Successful Signup', status: statusRes, jwtPresent: !!jsonRes.token, bcryptVerified: isMatched });

    // Test 2
    req = { body: { name: 'Bob', email: 'existing@example.com', password: 'password' } };
    statusRes = 200; jsonRes = null;
    await authController.signup(req, {
        status: function (code) { statusRes = code; return this; },
        json: function (data) { jsonRes = data; return this; }
    });
    results.push({ name: 'TEST 2: Duplicate Email', status: statusRes, message: jsonRes.message });

    // Test 3
    req = { body: { email: 'bob@example.com' } };
    statusRes = 200; jsonRes = null;
    await authController.signup(req, {
        status: function (code) { statusRes = code; return this; },
        json: function (data) { jsonRes = data; return this; }
    });
    results.push({ name: 'TEST 3: Missing Fields', status: statusRes, message: jsonRes.message });

    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
}

runTests();
