# Reconnaissance & Attack Surface Mapping Skill

## Purpose
Automate initial intelligence gathering against target domains and IP ranges.

## Capabilities
- Subdomain passive enumeration (crt.sh, AlienVault OTX, DNS dumps)
- Port scanning via Nmap with timing template -T4 and service detection (-sV)
- Web technology stack detection (Wappalyzer signatures)
- Cloud asset and S3 bucket discovery

## Execution Guidelines
1. Always begin with passive DNS discovery to avoid alerting blue team detection.
2. Probe standard web ports (80, 443, 8080, 8443) before expanding to full port sweeps.
3. Record all exposed services and headers in the shared reconnaissance dossier.
