// Save this as oauth-server-production.js
const express = require('express');
const crypto = require('crypto');

const app = express();

// Enable CORS to allow Power Query to access this service
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Your NetSuite PRODUCTION OAuth credentials
const OAUTH_CONFIG = {
    consumerKey: '5899143f167fc4ed050102899cba69e3ae2732cb2a1c6ea64f6a7217abbd24c3',
    consumerSecret: '41730a91209dc02cf8ac6dfc20c26249bea20f7dfad06feadaf1c6e586d02dad', // ⚠️ REPLACE WITH YOUR ACTUAL CONSUMER SECRET
    tokenId: 'd2bba20862c9e2291fbe088bef513cb1de314e8308fe0fef0c5d900882982d7d',
    tokenSecret: 'ff1b2fe501dac038602a487330d0f246024e2f0cc3871728ee3d3bd2e46200d0'
};

// Function to generate OAuth signature
function generateOAuthSignature(url, method = 'GET', params = {}) {
    console.log('Generating OAuth signature for PRODUCTION...');
    console.log('Parameters:', params);
    
    // Create timestamp and nonce (random string)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);
    
    // OAuth parameters
    const oauthParams = {
        oauth_consumer_key: OAUTH_CONFIG.consumerKey,
        oauth_token: OAUTH_CONFIG.tokenId,
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: timestamp,
        oauth_nonce: nonce,
        oauth_version: '1.0'
    };
    
    // Combine all parameters
    const allParams = { ...params, ...oauthParams };
    
    // Create parameter string (sorted alphabetically)
    const paramString = Object.keys(allParams)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
        .join('&');
    
    console.log('Parameter string:', paramString);
    
    // Create signature base string
    const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    
    console.log('Signature base:', signatureBase);
    
    // Create signing key
    const signingKey = `${encodeURIComponent(OAUTH_CONFIG.consumerSecret)}&${encodeURIComponent(OAUTH_CONFIG.tokenSecret)}`;
    
    // Generate HMAC-SHA256 signature
    const signature = crypto.createHmac('sha256', signingKey)
                           .update(signatureBase)
                           .digest('base64');
    
    console.log('Generated signature:', signature);
    
    // Create authorization header - UPDATED FOR PRODUCTION
    const authHeader = `OAuth realm="9347371", ` +
                      `oauth_consumer_key="${OAUTH_CONFIG.consumerKey}", ` +
                      `oauth_token="${OAUTH_CONFIG.tokenId}", ` +
                      `oauth_signature_method="HMAC-SHA256", ` +
                      `oauth_timestamp="${timestamp}", ` +
                      `oauth_nonce="${nonce}", ` +
                      `oauth_version="1.0", ` +
                      `oauth_signature="${encodeURIComponent(signature)}"`;
    
    return {
        timestamp,
        nonce,
        signature,
        authHeader,
        expiresIn: 3600 // 1 hour
    };
}

// API endpoint to generate OAuth signature - NOW SUPPORTS DYNAMIC PARAMETERS!
app.get('/oauth-signature', (req, res) => {
    try {
        console.log('\n=== New PRODUCTION OAuth Signature Request ===');
        console.log('Time:', new Date().toISOString());
        console.log('Query parameters received:', req.query);
        
        // Get parameters from URL query or use defaults
        const script = req.query.script || '1752';
        const deploy = req.query.deploy || '1';
        const searchId = req.query.searchId || '2264';  // 🟢 NOW DYNAMIC!
        
        console.log(`📋 Using: script=${script}, deploy=${deploy}, searchId=${searchId}`);
        
        // Base URL for NetSuite restlet - UPDATED FOR PRODUCTION
        const url = 'https://9347371.restlets.api.netsuite.com/app/site/hosting/restlet.nl';
        const method = 'GET';
        
        // Dynamic parameters object
        const params = {
            script: script,
            deploy: deploy,
            searchId: searchId
        };
        
        // Generate the signature
        const result = generateOAuthSignature(url, method, params);
        
        console.log(`✅ PRODUCTION OAuth signature generated successfully for searchId: ${searchId}`);
        
        // Return the result
        res.json({
            success: true,
            ...result,
            searchId: searchId,
            environment: 'PRODUCTION',
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error generating PRODUCTION OAuth signature:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'PRODUCTION OAuth service is running!',
        environment: 'PRODUCTION',
        timestamp: new Date().toISOString()
    });
});

// Start the server on a different port to avoid conflicts with sandbox
const PORT = 3001; // ⚠️ DIFFERENT PORT FOR PRODUCTION
app.listen(PORT, () => {
    console.log('🚀 PRODUCTION OAuth Signature Service Started!');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 OAuth endpoint: http://localhost:${PORT}/oauth-signature`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
    console.log('\n💡 Ready to generate PRODUCTION OAuth signatures for NetSuite!');
    console.log('📊 Power Query can now call this service for dynamic signatures.');
    console.log('\n🆕 NEW: Now supports dynamic searchId via URL parameters!');
    console.log('📝 Examples:');
    console.log('   http://localhost:3001/oauth-signature (uses default searchId=2264)');
    console.log('   http://localhost:3001/oauth-signature?searchId=2136');
    console.log('   http://localhost:3001/oauth-signature?searchId=2426');
    console.log('   http://localhost:3001/oauth-signature?script=1752&deploy=1&searchId=2136\n');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down PRODUCTION OAuth service...');
    process.exit(0);
});