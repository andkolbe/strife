const dotenv =  require('dotenv');

dotenv.config();

module.exports = {
    redis: {
        tls_url: process.env.REDIS_TLS_URL,
        url: process.env.REDIS_URL
    }
}