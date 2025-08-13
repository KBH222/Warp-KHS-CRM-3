# Deployment & Infrastructure Architecture

## Overview

The KHS CRM infrastructure is designed for high availability, scalability, and cost-effectiveness on AWS. The architecture supports zero-downtime deployments, automatic scaling, and comprehensive monitoring while keeping operational complexity manageable for a small team.

## Infrastructure Architecture

### High-Level Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DNS (Route 53)                              │
│                         app.khscrm.com                               │
└─────────────────────┬───────────────────┬───────────────────────────┘
                      │                   │
┌─────────────────────▼─────────┐  ┌─────▼──────────────────────────┐
│       CloudFront CDN          │  │   Application Load Balancer     │
│   (Static Assets & PWA)       │  │        (API Traffic)            │
└─────────────┬─────────────────┘  └─────────────┬───────────────────┘
              │                                   │
              │                     ┌─────────────▼───────────────┐
              │                     │      ECS Fargate Cluster     │
              │                     │  ┌────────┐  ┌────────┐    │
              │                     │  │ Task 1 │  │ Task 2 │    │
              │                     │  │  API   │  │  API   │    │
              │                     │  └────────┘  └────────┘    │
              │                     └─────────────┬───────────────┘
              │                                   │
┌─────────────▼─────────────────┐  ┌─────────────▼───────────────┐
│         S3 Bucket             │  │      RDS PostgreSQL         │
│    (Frontend Assets)          │  │     (Primary Database)      │
└───────────────────────────────┘  └─────────────┬───────────────┘
                                                  │
                                   ┌──────────────▼───────────────┐
                                   │   ElastiCache Redis         │
                                   │   (Session & Cache)         │
                                   └──────────────────────────────┘
```

### AWS Services Architecture

```yaml
# Infrastructure components
Production:
  Region: us-east-1
  
  Networking:
    VPC:
      CIDR: 10.0.0.0/16
      AvailabilityZones: 3
      
    Subnets:
      Public:
        - 10.0.1.0/24 (us-east-1a)
        - 10.0.2.0/24 (us-east-1b)
        - 10.0.3.0/24 (us-east-1c)
      Private:
        - 10.0.11.0/24 (us-east-1a)
        - 10.0.12.0/24 (us-east-1b)
        - 10.0.13.0/24 (us-east-1c)
        
  Frontend:
    S3:
      Bucket: khs-crm-frontend-prod
      Versioning: Enabled
      Encryption: AES-256
      
    CloudFront:
      Origins:
        - S3 (Primary)
        - ALB (API)
      Behaviors:
        - /api/* → ALB
        - /* → S3
      Features:
        - HTTP/2
        - Compression
        - Custom Error Pages
        
  Backend:
    ECS:
      Cluster: khs-crm-prod
      Service: khs-crm-api
      Tasks: 2-10 (Auto-scaling)
      CPU: 512 (0.5 vCPU)
      Memory: 1024 (1 GB)
      
    ALB:
      Type: Application
      Listeners:
        - HTTPS (443)
      Target Groups:
        - ECS Service
      Health Check:
        Path: /api/health
        Interval: 30s
        
  Database:
    RDS:
      Engine: PostgreSQL 16
      Instance: db.t3.small
      Storage: 100GB GP3
      Multi-AZ: Yes
      Backups: 7 days
      
    ElastiCache:
      Engine: Redis 7
      Instance: cache.t3.micro
      Nodes: 2 (Cluster mode)
      
  Storage:
    S3:
      Backups: khs-crm-backups
      Logs: khs-crm-logs
      
  Monitoring:
    CloudWatch:
      Dashboards: Yes
      Alarms: Yes
      Logs: Yes
      
    X-Ray:
      Tracing: Enabled
      
  Security:
    WAF:
      WebACL: Attached to CloudFront
      Rules:
        - Rate limiting
        - SQL injection protection
        - XSS protection
```

## Deployment Architecture

### CI/CD Pipeline

```yaml
# GitHub Actions Workflow
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: khs-crm-api
  ECS_SERVICE: khs-crm-api
  ECS_CLUSTER: khs-crm-prod

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run security scan
        run: npm audit --production

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build frontend
        run: |
          cd packages/frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: https://app.khscrm.com/api
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: packages/frontend/dist

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest packages/backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy-frontend:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: dist
          
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://khs-crm-frontend-prod/ \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html" \
            --exclude "manifest.json"
            
          aws s3 sync dist/ s3://khs-crm-frontend-prod/ \
            --cache-control "public, max-age=0, must-revalidate" \
            --exclude "*" \
            --include "*.html" \
            --include "manifest.json"
            
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  deploy-backend:
    needs: build-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --force-new-deployment
            
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}

  post-deploy:
    needs: [deploy-frontend, deploy-backend]
    runs-on: ubuntu-latest
    steps:
      - name: Run smoke tests
        run: |
          npm run test:smoke
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: Production deployment completed
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Infrastructure as Code

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "khs-crm-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  cidr_block           = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  
  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  engine_version      = "16.1"
  instance_class      = "db.t3.small"
  allocated_storage   = 100
  storage_encrypted   = true
  backup_retention    = 7
  multi_az           = true
  
  database_name       = "khscrm"
  master_username     = "khsadmin"
  
  tags = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  cluster_name        = "khs-crm-prod"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  
  service_name       = "khs-crm-api"
  task_cpu          = 512
  task_memory       = 1024
  desired_count     = 2
  
  container_image    = "${aws_ecr_repository.api.repository_url}:latest"
  container_port     = 3001
  
  environment_variables = {
    NODE_ENV        = "production"
    DATABASE_URL    = module.rds.connection_string
    REDIS_URL       = module.elasticache.connection_string
  }
  
  secrets = {
    JWT_SECRET = aws_secretsmanager_secret.jwt_secret.arn
  }
  
  autoscaling = {
    min_capacity = 2
    max_capacity = 10
    
    cpu_target_value    = 70
    memory_target_value = 80
  }
  
  tags = local.common_tags
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"
  
  s3_bucket_domain = module.s3_frontend.bucket_domain_name
  alb_domain       = module.alb.dns_name
  
  aliases = ["app.khscrm.com"]
  acm_certificate_arn = aws_acm_certificate.main.arn
  
  cache_behaviors = {
    "/api/*" = {
      target_origin_id = "alb"
      allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods   = ["GET", "HEAD"]
      compress        = true
      
      forwarded_values = {
        query_string = true
        headers      = ["Authorization", "CloudFront-Forwarded-Proto"]
        cookies      = "all"
      }
    }
  }
  
  tags = local.common_tags
}
```

### Container Configuration

```dockerfile
# packages/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=backend --include-workspace-root

# Copy source
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build
RUN npm run build:shared
RUN npm run build:backend

# Production image
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --production --workspace=backend --include-workspace-root

# Copy built application
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY packages/backend/prisma ./packages/backend/prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/server.js"]
```

## Scaling Architecture

### Auto-Scaling Configuration

```typescript
// ECS Service Auto-scaling
const scalingPolicy = {
  // Target tracking scaling
  targetTrackingScaling: [
    {
      metricType: 'ECSServiceAverageCPUUtilization',
      targetValue: 70,
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
    {
      metricType: 'ECSServiceAverageMemoryUtilization',
      targetValue: 80,
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
  ],
  
  // Step scaling for rapid response
  stepScaling: {
    metric: 'RequestCountPerTarget',
    adjustmentType: 'PercentChangeInCapacity',
    steps: [
      { threshold: 1000, adjustment: 20 },
      { threshold: 2000, adjustment: 50 },
      { threshold: 5000, adjustment: 100 },
    ],
  },
  
  // Scheduled scaling
  scheduledScaling: [
    {
      name: 'scale-up-morning',
      schedule: 'cron(0 6 * * MON-FRI)', // 6 AM weekdays
      minCapacity: 4,
      maxCapacity: 10,
    },
    {
      name: 'scale-down-evening',
      schedule: 'cron(0 18 * * *)', // 6 PM daily
      minCapacity: 2,
      maxCapacity: 6,
    },
  ],
};

// Database read replicas
const databaseScaling = {
  readReplicas: {
    count: 2,
    instanceClass: 'db.t3.small',
    availabilityZones: ['us-east-1b', 'us-east-1c'],
  },
  
  connectionPooling: {
    maxConnections: 100,
    minConnections: 10,
    idleTimeoutMillis: 30000,
  },
  
  queryOptimization: {
    slowQueryLog: true,
    performanceInsights: true,
    enhancedMonitoring: true,
  },
};
```

### CDN Optimization

```javascript
// CloudFront behaviors
const cdnConfiguration = {
  // Static assets - long cache
  '*.js': {
    cachePolicyId: 'Managed-CachingOptimized',
    ttl: {
      default: 31536000, // 1 year
      max: 31536000,
    },
    compress: true,
  },
  
  // API responses - short cache
  '/api/*': {
    cachePolicyId: 'Custom-API-Caching',
    ttl: {
      default: 0,
      max: 300, // 5 minutes
    },
    headers: ['Authorization', 'Accept', 'Content-Type'],
    queryStrings: true,
  },
  
  // Service Worker - no cache
  '/sw.js': {
    cachePolicyId: 'Managed-CachingDisabled',
    ttl: {
      default: 0,
      max: 0,
    },
  },
  
  // Origin request policies
  originRequestPolicy: {
    headerBehavior: 'whitelist',
    headers: ['CloudFront-Viewer-Country', 'CloudFront-Is-Mobile-Viewer'],
    queryStringBehavior: 'all',
    cookieBehavior: 'whitelist',
    cookies: ['session', 'auth-token'],
  },
};
```

## Monitoring & Observability

### CloudWatch Configuration

```yaml
# CloudWatch dashboards
Dashboards:
  ApplicationDashboard:
    Widgets:
      - APIRequestRate:
          Metric: AWS/ApplicationELB/RequestCount
          Stat: Sum
          Period: 300
          
      - APILatency:
          Metric: AWS/ApplicationELB/TargetResponseTime
          Stat: Average
          Period: 300
          
      - ErrorRate:
          Metric: AWS/ApplicationELB/HTTPCode_Target_5XX_Count
          Stat: Sum
          Period: 300
          
      - DatabaseConnections:
          Metric: AWS/RDS/DatabaseConnections
          Stat: Average
          Period: 300
          
      - CacheHitRate:
          Metric: AWS/ElastiCache/CacheHitRate
          Stat: Average
          Period: 300

Alarms:
  - HighErrorRate:
      MetricName: HTTPCode_Target_5XX_Count
      Threshold: 10
      Period: 300
      EvaluationPeriods: 2
      Actions:
        - SNS: alerts-critical
        
  - HighLatency:
      MetricName: TargetResponseTime
      Threshold: 1000 # 1 second
      Period: 300
      EvaluationPeriods: 3
      Actions:
        - SNS: alerts-warning
        
  - DatabaseCPU:
      MetricName: CPUUtilization
      Threshold: 80
      Period: 300
      EvaluationPeriods: 2
      Actions:
        - SNS: alerts-warning
        - AutoScaling: add-read-replica
```

### Application Performance Monitoring

```typescript
// AWS X-Ray integration
import AWSXRay from 'aws-xray-sdk-core';
import express from 'express';

const app = express();

// Capture all AWS SDK calls
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Capture Express
app.use(AWSXRay.express.openSegment('KHS-CRM-API'));

// Custom segments
app.get('/api/customers', async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('CustomerQuery');
  
  try {
    subsegment.addAnnotation('userId', req.user.id);
    subsegment.addMetadata('query', req.query);
    
    const customers = await customerService.findAll(req.query);
    
    subsegment.addMetadata('resultCount', customers.length);
    res.json(customers);
  } finally {
    subsegment.close();
  }
});

app.use(AWSXRay.express.closeSegment());

// CloudWatch Logs integration
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      logGroupName: '/aws/ecs/khs-crm-api',
      logStreamName: `${process.env.HOSTNAME}`,
      awsRegion: 'us-east-1',
      jsonMessage: true,
      retentionInDays: 30,
    }),
  ],
  defaultMeta: {
    service: 'khs-crm-api',
    environment: process.env.NODE_ENV,
  },
});

// Structured logging
logger.info('API request', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  duration: responseTime,
  statusCode: res.statusCode,
});
```

## Disaster Recovery

### Backup Strategy

```yaml
# Automated backup configuration
Backups:
  Database:
    Schedule: "0 2 * * *" # 2 AM daily
    Retention: 30 days
    Type: Automated snapshots
    CrossRegion: us-west-2
    
  Application:
    Schedule: "0 3 * * *" # 3 AM daily
    Retention: 7 days
    Items:
      - S3 buckets
      - ECS task definitions
      - Secrets Manager secrets
      
  Configuration:
    Schedule: "0 4 * * *" # 4 AM daily
    Retention: 90 days
    Items:
      - Terraform state
      - CloudFormation templates
      - Parameter Store values
```

### Recovery Procedures

```typescript
// Disaster recovery runbook
interface DisasterRecoveryPlan {
  scenarios: {
    databaseFailure: {
      detection: 'CloudWatch alarm or manual report';
      rto: '30 minutes'; // Recovery Time Objective
      rpo: '5 minutes';  // Recovery Point Objective
      steps: [
        'Verify primary database failure',
        'Promote read replica to primary',
        'Update application connection strings',
        'Verify application connectivity',
        'Create new read replica',
      ];
    };
    
    regionFailure: {
      detection: 'Route 53 health checks';
      rto: '1 hour';
      rpo: '1 hour';
      steps: [
        'Confirm region-wide failure',
        'Execute cross-region failover',
        'Update DNS records',
        'Restore from cross-region backups',
        'Notify users of temporary degradation',
      ];
    };
    
    dataCorruption: {
      detection: 'Application errors or data validation';
      rto: '2 hours';
      rpo: 'Point in time';
      steps: [
        'Identify corruption scope',
        'Stop write operations',
        'Restore from point-in-time backup',
        'Validate data integrity',
        'Resume normal operations',
      ];
    };
  };
  
  communication: {
    internal: ['CTO', 'DevOps', 'Support'];
    external: ['Status page update', 'Customer email'];
    channels: ['Slack', 'PagerDuty', 'Email'];
  };
}

// Automated recovery script
async function executeFailover(scenario: string): Promise<void> {
  logger.alert(`Executing failover for scenario: ${scenario}`);
  
  switch (scenario) {
    case 'database':
      await promoteReadReplica();
      await updateConnectionStrings();
      await verifyConnectivity();
      break;
      
    case 'region':
      await activateStandbyRegion();
      await updateRoute53();
      await notifyUsers();
      break;
  }
  
  logger.info(`Failover completed for scenario: ${scenario}`);
}
```

## Security Hardening

### Infrastructure Security

```yaml
# Security configurations
Security:
  Network:
    SecurityGroups:
      - ALB:
          Ingress:
            - Port: 443
              Source: 0.0.0.0/0
          Egress:
            - Port: 3001
              Destination: ECS
              
      - ECS:
          Ingress:
            - Port: 3001
              Source: ALB
          Egress:
            - Port: 5432
              Destination: RDS
            - Port: 6379
              Destination: ElastiCache
              
      - RDS:
          Ingress:
            - Port: 5432
              Source: ECS
              
    NetworkACLs:
      - DenyKnownBadIPs
      - AllowOnlyHTTPS
      
  WAF:
    Rules:
      - RateLimiting:
          Limit: 2000
          Window: 5 minutes
          
      - GeoBlocking:
          Allow: [US, CA, MX]
          
      - CommonAttacks:
          - SQLInjection
          - XSS
          - PathTraversal
          
  Compliance:
    - EnableCloudTrail
    - EnableGuardDuty
    - EnableSecurityHub
    - ConfigureAWSConfig
```

### Secrets Management

```typescript
// AWS Secrets Manager integration
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class SecretsManager {
  private client: SecretsManagerClient;
  private cache = new Map<string, { value: any; expires: number }>();
  
  constructor() {
    this.client = new SecretsManagerClient({ region: 'us-east-1' });
  }
  
  async getSecret(secretName: string): Promise<any> {
    // Check cache
    const cached = this.cache.get(secretName);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      
      const value = response.SecretString 
        ? JSON.parse(response.SecretString)
        : response.SecretBinary;
      
      // Cache for 5 minutes
      this.cache.set(secretName, {
        value,
        expires: Date.now() + 5 * 60 * 1000,
      });
      
      return value;
    } catch (error) {
      logger.error(`Failed to retrieve secret: ${secretName}`, error);
      throw error;
    }
  }
  
  async rotateSecret(secretName: string): Promise<void> {
    // Implement secret rotation logic
    const newSecret = await this.generateNewSecret();
    await this.updateSecret(secretName, newSecret);
    await this.updateApplication(newSecret);
    await this.verifyRotation();
  }
}

// Environment configuration
const config = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: await secrets.getSecret('rds-password'),
  },
  jwt: {
    secret: await secrets.getSecret('jwt-secret'),
    refreshSecret: await secrets.getSecret('jwt-refresh-secret'),
  },
  redis: {
    url: process.env.REDIS_URL,
    password: await secrets.getSecret('redis-password'),
  },
};
```

## Cost Optimization

### Resource Optimization

```yaml
# Cost optimization strategies
CostOptimization:
  Compute:
    - Use Fargate Spot for non-critical tasks (70% savings)
    - Right-size container resources based on metrics
    - Implement request-based auto-scaling
    
  Storage:
    - S3 lifecycle policies:
        - Infrequent Access after 30 days
        - Glacier after 90 days
        - Delete after 365 days
    - Enable S3 Intelligent-Tiering
    - Compress CloudWatch Logs
    
  Database:
    - Use Aurora Serverless for dev/staging
    - Enable RDS auto-stop for non-prod
    - Optimize queries to reduce I/O
    
  Network:
    - Use CloudFront for egress cost reduction
    - Enable VPC endpoints for AWS services
    - Compress API responses
    
  Monitoring:
    - Implement cost allocation tags
    - Set up billing alerts
    - Use AWS Cost Explorer
    - Regular cost reviews
```

### Cost Monitoring

```typescript
// Cost tracking implementation
class CostMonitor {
  async getDailyCosts(): Promise<CostReport> {
    const ce = new CostExplorerClient({ region: 'us-east-1' });
    
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        End: moment().format('YYYY-MM-DD'),
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        { Type: 'DIMENSION', Key: 'SERVICE' },
        { Type: 'TAG', Key: 'Environment' },
      ],
    });
    
    const response = await ce.send(command);
    return this.formatCostReport(response);
  }
  
  async checkBudgetAlerts(): Promise<BudgetAlert[]> {
    const budgets = new BudgetsClient({ region: 'us-east-1' });
    
    const alerts = [];
    for (const budget of await this.getBudgets()) {
      if (budget.calculatedSpend.actualSpend.amount > budget.budgetLimit.amount * 0.8) {
        alerts.push({
          budgetName: budget.budgetName,
          spent: budget.calculatedSpend.actualSpend.amount,
          limit: budget.budgetLimit.amount,
          percentage: (budget.calculatedSpend.actualSpend.amount / budget.budgetLimit.amount) * 100,
        });
      }
    }
    
    return alerts;
  }
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] Secrets rotated if needed
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

### Deployment

- [ ] Create deployment tag
- [ ] Deploy to staging
- [ ] Run smoke tests on staging
- [ ] Deploy to production (blue/green)
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-Deployment

- [ ] Verify all services healthy
- [ ] Check application logs
- [ ] Monitor user reports
- [ ] Update status page
- [ ] Document any issues
- [ ] Schedule retrospective
- [ ] Update runbooks