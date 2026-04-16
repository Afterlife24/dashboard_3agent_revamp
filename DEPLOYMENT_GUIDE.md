# Dashboard (dashboard_3agent_revamp) — AWS Deployment Guide

## Architecture

- **S3 Bucket**: `dashboard.afterlife.org.in` (ap-south-1) — static build files
- **CloudFront Distribution**: CDN with HTTPS
- **Domain**: `dashboard.afterlife.org.in` — subdomain under existing hosted zone
- **SSL Certificate**: ACM certificate in `us-east-1` (required for CloudFront)
- **Backend**: Already deployed on AWS Lambda (`https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com`)

This is a pure static frontend deployment. The backend is already live.

---

## Step 1: Build the Frontend

```bash
cd dashboard_3agent_revamp
npm install
npm run build
```

Make sure `.env` has the production API URL:

```
VITE_API_URL=https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com
```

This creates a `dist/` folder.

---

## Step 2: Create S3 Bucket

1. AWS Console → S3 → Create bucket
2. Bucket name: `dashboard.afterlife.org.in`
3. Region: `ap-south-1` (Mumbai)
4. Block all public access: **enabled** (CloudFront handles access via OAC)
5. Leave everything else default → Create bucket

---

## Step 3: Upload Build Files to S3

```bash
aws s3 sync dist/ s3://dashboard.afterlife.org.in --delete
```

---

## Step 4: Request SSL Certificate (ACM)

1. AWS Console → Switch to **us-east-1** region (N. Virginia) — required for CloudFront
2. Certificate Manager (ACM) → Request public certificate
3. Domain name: `dashboard.afterlife.org.in`
4. Validation method: **DNS**
5. Click "Request"
6. On the certificate details page, click **"Create records in Route 53"** — this auto-creates the CNAME validation record in your `afterlife.org.in` hosted zone
7. Wait for status to change to **Issued** (usually 2-5 minutes)
8. Note the certificate ARN

---

## Step 5: Create CloudFront Distribution

1. AWS Console → CloudFront → Create distribution

### Origin settings
- Origin domain: `dashboard.afterlife.org.in.s3.ap-south-1.amazonaws.com`
- Origin access: **Origin Access Control (OAC)**
  - Create new OAC → Name: `dashboard-oac` → Sign requests → Create

### Default cache behavior
- Viewer protocol policy: **Redirect HTTP to HTTPS**
- Allowed HTTP methods: GET, HEAD
- Compress objects automatically: Yes

### Settings
- Alternate domain name (CNAME): `dashboard.afterlife.org.in`
- Custom SSL certificate: select the ACM certificate from Step 4
- Default root object: `index.html`

2. Click **Create distribution**
3. Note the **Distribution ID** and **domain name** (e.g. `dxxxxxxxxxx.cloudfront.net`)

---

## Step 6: Update S3 Bucket Policy

After creating the distribution, CloudFront will show a banner to update the S3 bucket policy. Click "Copy policy" or use this template:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dashboard.afterlife.org.in/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<YOUR_ACCOUNT_ID>:distribution/<YOUR_DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

Apply it: S3 → `dashboard.afterlife.org.in` → Permissions → Bucket policy → Paste and save.

---

## Step 7: Configure CloudFront Error Pages (SPA Routing)

The app uses React Router, so direct URL access to routes like `/users` would return 403 from S3. Fix this with custom error responses:

1. CloudFront → your distribution → **Error pages** tab
2. Create custom error response:
   - HTTP error code: **403** → Response page path: `/index.html` → HTTP response code: **200**
3. Create another:
   - HTTP error code: **404** → Response page path: `/index.html` → HTTP response code: **200**

---

## Step 8: Route 53 DNS Record

1. AWS Console → Route 53 → Hosted zones → `afterlife.org.in`
2. Create record:
   - Record name: `dashboard`
   - Record type: **A**
   - Alias: **Yes**
   - Route traffic to: **Alias to CloudFront distribution**
   - Select your distribution from the dropdown
3. Create record

---

## Step 9: Verify

Wait 5-10 minutes for CloudFront to deploy, then visit:

```
https://dashboard.afterlife.org.in
```

Check browser console — `/api/` calls should go to the Lambda backend via `VITE_API_URL`.

---

## Manual Redeployment

```bash
cd dashboard_3agent_revamp
npm run build
aws s3 sync dist/ s3://dashboard.afterlife.org.in --delete
aws cloudfront create-invalidation --distribution-id <YOUR_DISTRIBUTION_ID> --paths "/*"
```

---

## GitHub Actions CI/CD

Pipeline is at `.github/workflows/prod.yml` — auto-deploys on every push to `main`.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | `ap-south-1` |
| `S3_BUCKET` | `dashboard.afterlife.org.in` (or whatever subdomain you chose) |
| `DISTRIBUTION_ID` | Your CloudFront distribution ID (printed by deploy.sh) |
| `VITE_API_URL` | `https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com` |

Set these in: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

---

## Key Resources

| Resource | Value |
|----------|-------|
| Live site | `https://dashboard.afterlife.org.in` |
| S3 bucket | `dashboard.afterlife.org.in` |
| S3 region | `ap-south-1` |
| ACM cert region | `us-east-1` |
| Hosted zone | `afterlife.org.in` |
| Backend API | `https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com` |
