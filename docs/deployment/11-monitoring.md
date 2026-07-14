# 11 Monitoring

## Telemetry Targets

- Application logs: stdout/stderr from containers to Docker/journald, shipped to Log Analytics.
- App metrics: Application Insights/OpenTelemetry.
- VM metrics: Azure Monitor VM insights.
- DB metrics: PostgreSQL Flexible Server metrics.
- Availability: HTTP probe to `/api/ready`.

## Log Fields

The backend already emits request IDs and structured security logs. Extend application logs over time to include:

- timestamp
- environment
- app version
- git commit
- request ID
- user ID or pseudonymous identifier
- endpoint
- status
- response time
- error category

Do not log tokens, cookies, secrets, full financial records, or sensitive personal data.

## Starting Alerts

| Alert | Starting threshold |
| --- | --- |
| App unavailable | 2 failed probes in 5 minutes |
| 5xx spike | >5% over 10 minutes |
| Response time | p95 > 2 seconds for 10 minutes |
| VM CPU | >80% for 15 minutes |
| VM memory | >85% for 15 minutes |
| Disk usage | >80% |
| DB CPU | >80% for 15 minutes |
| DB connections | >80% of limit |
| Auth failures | >20 in 5 minutes |
| Certificate expiry | <21 days |

Tune thresholds after observing UAT/Production baseline behaviour.

