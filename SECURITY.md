# Security Guidelines

## 🔒 Security Overview

This project implements several security measures to protect user data and prevent vulnerabilities.

## ⚠️ IMPORTANT: Environment Variables

**NEVER commit sensitive information to version control.**

### Required Environment Variables

1. **Google Places API Key**: Set `VITE_GOOGLE_PLACES_API_KEY` in your `.env` file
   - Get your key from: https://console.cloud.google.com/apis/credentials
   - Enable the Places API for your project
   - Restrict the key to your domains only

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your actual API keys and configuration:
   ```bash
   # Edit .env file with your real values
   VITE_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

## 🛡️ Security Features Implemented

### Backend Security
- **Helmet.js**: Security headers protection
- **CORS**: Configured for specific origins only
- **Rate Limiting**: API request throttling
- **Input Validation**: Sanitized user inputs
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: No sensitive data in error responses

### Frontend Security
- **Environment Variables**: API keys stored securely
- **Input Sanitization**: User inputs are validated
- **XSS Protection**: React's built-in protections
- **HTTPS Ready**: Secure transmission protocols

### Database Security
- **SQLite with WAL mode**: Concurrent read performance
- **No sensitive user data**: Only product information stored
- **Backup procedures**: Automated data backup

## 🚨 Known Security Considerations

### Puppeteer Dependencies (Backend)
**Current Status**: 5 high severity vulnerabilities in tar-fs and ws packages
- **Impact**: Affects web scraping functionality only
- **Risk Level**: Low for development/demo use
- **Action Required**: Update to Puppeteer v24+ before production deployment
- **Workaround**: Disable scraping in production environments if needed

```bash
# For production deployment, update Puppeteer (breaking changes):
cd backend && npm audit fix --force
```

## 🚨 Vulnerability Management

### Dependency Security
- Run `npm audit` regularly to check for vulnerabilities
- Update dependencies frequently
- Monitor security advisories

### Regular Security Checks
```bash
# Check frontend dependencies
npm audit

# Check backend dependencies
cd backend && npm audit

# Fix vulnerabilities automatically (when safe)
npm audit fix
```

## 📱 Production Deployment Security

### Environment Variables
- Use your hosting platform's secret management
- Never commit `.env` files to version control
- Rotate API keys regularly

### HTTPS
- Always use HTTPS in production
- Configure proper SSL certificates
- Enable HSTS headers

### API Security
- Implement proper authentication for sensitive endpoints
- Use API rate limiting
- Monitor for unusual access patterns

## 🔍 Security Monitoring

### What We Monitor
- Failed API requests
- Database connection attempts
- Unusual scraping patterns
- Resource usage spikes

### Logging
- All errors are logged without sensitive data
- Access patterns are monitored
- Performance metrics tracked

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: will.jow905@gmail.com
3. Include steps to reproduce
4. Provide impact assessment

## ✅ Security Checklist for Contributors

Before contributing:

- [ ] No hardcoded secrets or API keys
- [ ] Environment variables used for configuration
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] Dependencies are up to date
- [ ] Code follows security best practices

## 🔧 Local Development Security

### Safe Development Practices
- Use `.env.example` as a template
- Never commit your `.env` file
- Keep API keys restricted to localhost during development
- Regularly update dependencies

### Testing Security
- Test with invalid inputs
- Verify API key restrictions work
- Check that error messages don't leak sensitive data
- Validate input sanitization

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution. 
