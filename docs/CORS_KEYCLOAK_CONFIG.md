# CORS & Keycloak Configuration Guide

## Current Status
✅ **FIXED** - Frontend now correctly points to coproperty service on port 8088

---

## Issues Found & Fixed

### 1. **Frontend Port Mismatch** ❌→✅
**Problem**: Frontend was configured to use `http://localhost:5257` instead of actual service port

**File**: `src/front/myb.front/apps/client/envirements/envirement.ts`

**Fix Applied**:
```typescript
// BEFORE
baseUri: 'http://localhost:5257',

// AFTER
baseUri: 'http://localhost:8088',  // Matches actual coproperty service
```

### 2. **Keycloak CORS Configuration** ⚠️

**Current Setup** (myb-client in Keycloak):
```
Root URL:              http://localhost:4200
Home URL:              http://localhost:4200
Valid Redirect URIs:   http://localhost:4200/*
Web Origins:           http://localhost:4200
Admin URL:            http://localhost:4200/admin
```

**Recommended Additions** for backend service CORS:
Add these to **Web origins**:
```
http://localhost:8088    # Coproperty service
http://localhost:8083    # Invoice service
http://localhost:8082    # Timesheet service
http://localhost:8086    # Document manager
http://localhost:8084    # Payment service
```

---

## CORS Configuration Details

### Frontend (Port 4200)
✅ **Keycloak Config**: Complete
```
Root URL:     http://localhost:4200
Redirect:     http://localhost:4200/*
Origins:      http://localhost:4200
```

### Backend Services
⚠️ **Keycloak Config**: Needs update

Add all service ports to Keycloak **Web origins**:
```
http://localhost:8088   # myb-coproperty (GraphQL)
http://localhost:8083   # myb-invoice (GraphQL)
http://localhost:8082   # myb-timesheet (GraphQL)
http://localhost:8086   # myb-docmanager (GraphQL)
http://localhost:8084   # myb-payment (REST/GraphQL)
```

---

## Steps to Update Keycloak

### 1. Login to Keycloak Admin
- URL: `http://localhost:8080`
- Navigate to: **Realms → myb → Clients → myb-client**

### 2. Update Access Settings
- Scroll to **Web origins**
- Click **Add web origins**
- Add each service URL from above
- Click **Save**

### 3. Verify CORS Headers
After saving, backend services will respond with:
```
Access-Control-Allow-Origin: http://localhost:8088
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Service Port Mapping

| Service | Port | Type | URL |
|---------|------|------|-----|
| Frontend (Client) | 4200 | Angular/Nginx | http://localhost:4200 |
| Coproperty | 8088 | GraphQL | http://localhost:8088/graphql |
| Invoice | 8083 | GraphQL | http://localhost:8083/graphql |
| Timesheet | 8082 | GraphQL | http://localhost:8082/graphql |
| Document Manager | 8086 | GraphQL | http://localhost:8086/graphql |
| Payment | 8084 | REST/GraphQL | http://localhost:8084/graphql |
| Keycloak | 8080 | OAuth2/OIDC | http://localhost:8080 |

---

## Backend Service CORS Setup

### .NET Configuration
Each backend service (Program.cs) has CORS enabled:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Later in pipeline:
app.UseCors("AllowAll");
```

✅ **Status**: All backend services allow cross-origin requests

---

## Testing CORS

### Frontend to Backend
```bash
curl -X POST http://localhost:8088/graphql \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4200" \
  -d '{"query":"{ __typename }"}'
```

**Expected Response Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

### With Keycloak Token
```bash
TOKEN="your-jwt-token"
curl -X POST http://localhost:8088/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: http://localhost:4200" \
  -d '{"query":"{ __typename }"}'
```

---

## Keycloak OAuth2 Flow

### Frontend Login Flow
```
1. User clicks "Login" on http://localhost:4200
2. Redirects to Keycloak: http://localhost:8080/auth
3. User authenticates
4. Keycloak redirects to: http://localhost:4200 (callback)
5. Frontend receives JWT token
6. Token stored in localStorage/sessionStorage
```

### Frontend to Backend Communication
```
1. Frontend: Sends GraphQL request to http://localhost:8088/graphql
2. Request includes JWT in Authorization header
3. Backend validates token with Keycloak
4. Backend responds with data
```

---

## Configuration Summary

### ✅ Complete
- [x] Frontend environment config (port 8088)
- [x] Backend CORS policies
- [x] Keycloak basic client setup (frontend)
- [x] OAuth2 flow enabled

### ⚠️ Recommended
- [ ] Update Keycloak Web origins to include backend services
- [ ] Test CORS headers with actual token
- [ ] Configure token validation on backend services
- [ ] Set up authorization roles in Keycloak

### Optional
- [ ] Configure HTTPS/SSL for production
- [ ] Set up environment-specific configurations
- [ ] Add request/response logging for debugging

---

## Common CORS Issues & Solutions

### Issue: "No 'Access-Control-Allow-Origin' header"
**Cause**: Service URL not in Keycloak Web origins  
**Solution**: Add service URL to Keycloak `Web origins` setting

### Issue: "Credentials mode is 'include' but token missing"
**Cause**: Token not being sent in Authorization header  
**Solution**: Verify Apollo Client/HttpClient includes `Authorization: Bearer <token>`

### Issue: "CORS policy blocked"
**Cause**: Frontend origin not in backend CORS policy  
**Solution**: Backend already configured with `AllowAnyOrigin()` - check network tab

### Issue: "Token expired"
**Cause**: JWT token lifetime exceeded  
**Solution**: Refresh token or re-authenticate via Keycloak

---

## Files Modified

1. **Environment Configuration**
   - `src/front/myb.front/apps/client/envirements/envirement.ts`
   - Changed baseUri from 5257 to 8088

2. **Keycloak Client** (Requires manual update)
   - Realm: `myb`
   - Client: `myb-client`
   - Add Web origins for backend services

---

## Verification Checklist

- [x] Frontend rebuilds successfully
- [x] Frontend container running (port 4200)
- [x] Coproperty service running (port 8088)
- [x] Network requests go to correct port
- [x] CORS headers present in responses
- [ ] Keycloak Web origins updated (manual step)
- [ ] Token validation working on backend

---

## Next Steps

1. **Update Keycloak** - Add backend service origins
2. **Test CORS** - Use browser dev tools Network tab
3. **Verify Token** - Ensure JWT in Authorization header
4. **Test Mutations** - Try CreateFundCall with authentication
5. **Monitor Logs** - Check backend for validation errors

---

*Updated: January 16, 2026*
*Status: CORS Fixed ✅ | Keycloak Update Pending ⚠️*
